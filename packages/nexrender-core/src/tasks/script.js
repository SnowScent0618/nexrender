const fs     = require('fs')
const path   = require('path')
const script = require('../assets/nexrender.jsx')

/* helpers */
const escape = string => `'${string.replace(/\'/g, '\\\'')}'`

const selectLayers = ({ composition, layerName, layerIndex }, callbackString) => {
    const method = layerName ? 'selectLayersByName' : 'selectLayersByIndex';
    const compo  = composition === undefined ? 'null' : escape(composition);
    const value  = layerName ? escape(layerName) : layerIndex;

    return (`nexrender.${method}(${compo}, ${value}, ${callbackString});`);
}

const renderValue = (value, string) => {
    const encoded = typeof value == 'string' ? escape(value) : JSON.stringify(value);
    return value === undefined ? undefined : encoded;
}

const partsOfKeypath = (keypath) => {
    var parts = keypath.split('->');
    return (parts.length === 1) ? keypath.split('.') : parts
}

/* scripting wrappers */
const wrapFootage = ({ dest, ...asset }) => (`(function() {
    ${selectLayers(asset, `function(layer) {
        nexrender.replaceFootage(layer, '${dest.replace(/\\/g, "\\\\")}')
    }`)}
})();\n`)

const wrapData = ({ property, value, expression, ...asset }) => (`(function() {
    ${selectLayers(asset, /* syntax:js */`function(layer) {

        function changeValueForKeypath(o, keys, val, expr) {
            if (keys.length == 0) {
                return val ? val : expr;
            } else {
                var key = keys[0];
                if ("property" in o && o.property(key)) {
                    var prop = o.property(key)
                    var pval = prop.value;
                    var v = changeValueForKeypath(pval, keys.slice(1), val, expr)
                    if (val) {
                        prop.setValue(v)  
                    } else {
                        prop.expression = expr
                    }
                    return o;
                } else if (key in o) {
                    o[key] = changeValueForKeypath(o[key], keys.slice(1), val);
                    return o;
                } else {
                    throw new Error("nexrender: Can't find a property sequence (${property}) for key: " + key);                
                }
            }
        }

        var parts = ${JSON.stringify(partsOfKeypath(property))};
        changeValueForKeypath(layer, parts, ${renderValue(value)}, ${renderValue(expression)});

        return true;
    }`)}
})();\n`)

const wrapScript = ({ dest }) => (`(function() {
    ${fs.readFileSync(dest, 'utf8')}
})();\n`)

module.exports = (job, settings) => {
    settings.logger.log(`[${job.uid}] running script assemble...`);

    const data = [];
    const base = job.workpath;

    job.assets.map(asset => {
        switch (asset.type) {
            case 'video':
            case 'audio':
            case 'image':
                data.push(wrapFootage(asset));
                break;

            case 'data':
                data.push(wrapData(asset));
                break;

            case 'script':
                data.push(wrapScript(asset));
                break;
        }
    });

    /* write out assembled custom script file in the workpath */
    job.scriptfile = path.join(base, `nexrender-${job.uid}-script.jsx`);
    fs.writeFileSync(job.scriptfile, script
        .replace('/*COMPOSITION*/', job.template.composition)
        .replace('/*USERSCRIPT*/', data.join('\n'))
    );

    return Promise.resolve(job)
}
