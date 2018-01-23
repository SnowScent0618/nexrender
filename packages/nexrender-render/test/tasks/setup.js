'use strict';

const fs        = require('fs')
const path      = require('path')
const exec      = require('child_process').exec
const chai      = require('chai')
const chaiAsFs  = require('chai-fs')

chai.use(chaiAsFs);

global.should = chai.should();

// override paths for test folder
process.env.TEMP_DIRECTORY      = path.join(__dirname, 'temp');
process.env.TEMPLATES_DIRECTORY = path.join(__dirname, '..', 'res');

// require module
var setup = require('../../src/tasks/setup.js');

describe('Task: setup', () => {

    let project = {
        uid: 'mytestid',
        template: 'project.aepx',
        assets: []
    };

    const settings = {
        workpath: path.join(__dirname, 'temp'),
        logger: () => {},
    }

    let cperror = undefined;

    beforeEach((done) => {
        setup(project, settings).then((proj) => {
            project = proj; done();
        }).catch((err)=> {
            cperror = err; done();
        });
    });

    afterEach(() => {
        exec('rm -r ' + path.join(__dirname, 'temp'));
    });

    it('should set project\'s workpath', () => {
        project.should.have.property('workpath').and.equal(
            path.join(__dirname, 'temp', 'mytestid')
        );
    });

    describe('(with project-as-asset)', () => {
        before(() => {
            project.assets.push({
                name: 'project.aepx',
                type: 'project'
            });
        })

        it('should not copy project if project asset is provided', () => {
            path.join(__dirname, 'temp', 'mytestid', 'project.aep').should.not.be.a.path();
        });

        it('should set project.template to asset.name', () => {
            project.template.should.be.eql('project.aepx');
        });
    });
});
