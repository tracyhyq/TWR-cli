#!/usr/bin/env node --harmony
/*
 * @description: 
 * @author: tracyqiu
 * @LastEditors: tracyqiu
 * @LastEditTime: 2019-09-02 16:37:10
 */

const program = require('commander'); 
const config = require('../package.json');

program.version(config.version, '-v, --version')
.usage('<command> [项目名称]')
.command('init', 'init project')
.parse(process.argv);
