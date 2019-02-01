'use strict';

const os      = require('os')
const fs      = require('fs')
const path    = require('path')
const mkdirp  = require('mkdirp')
const nanoid  = require('nanoid')

/**
 * This task creates working directory for current job
 */
module.exports = (job, settings) => {
    /* TODO: add external job validation */
    if (!job || !job.template || !job.assets || !job.actions) {
        return Promise.reject(new Error('you must provide a configured nexrender job'))
    }

    if (!job.uid) job.uid = nanoid();
    settings.logger.log(`[${job.uid}] setting up job...`);

    // setup job's workpath
    job.workpath = path.join(settings.workpath, job.uid);
    mkdirp.sync(job.workpath);

    // set default job result file name
    if (job.template.outputExt) {
        job.resultname = 'result.' + job.template.outputExt;
    } else {
        job.resultname = 'result.' + (os.platform() === 'darwin' ? 'mov' : 'avi');
    }

    // NOTE: for still (jpg) image sequence frame filename will be changed to result_[#####].jpg
    if (job.template.outputExt && ['jpeg', 'jpg'].indexOf(job.template.outputExt) !== -1) {
        job.resultname    = 'result_[#####].' + job.template.outputExt;
        job.imageSequence = true;
    }

    return Promise.resolve(job)
};
