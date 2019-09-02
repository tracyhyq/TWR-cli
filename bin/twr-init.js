#!/usr/bin/env node
/*
 * @description: init command
 * @author: tracyqiu
 * @LastEditors: tracyqiu
 * @LastEditTime: 2019-09-02 16:57:47
 */
const path = require('path');
const fs = require('fs');
const os = require('os');
const download = require('../lib/download');
const generator = require('../lib/generator');
const program = require('commander'); // 命令行交互工具
const glob = require('glob'); // Match files using the patterns the shell uses, like stars and stuff.
const inquirer = require('inquirer'); // 终端交互工具
const chalk = require('chalk'); // Terminal string styling done right
const logSymbols = require('log-symbols'); // Colored symbols for various log levels
const latestVersion = require('latest-version');
const Ora = require('ora');
const exec = require('child_process').exec;
const versionCompare = require('../lib/versionCompare');
const config = require('../package.json');

program.usage('<project-name>')
  .option('-r, --repository [repository]', 'assign to repository', 'tracyhyq/ts-react-starter')
  .parse(process.argv);

let projectName = program.args[0];

if (!projectName) {  // project-name 必填
  // 相当于执行命令的--help选项，显示help信息，这是commander内置的一个命令选项
  program.help();
  return;
}

const list = glob.sync('*');  // 遍历当前目录
const rootName = path.basename(process.cwd()); // 获取执行当前命令的文件夹名称字符串

let next;
if (list.length) {  // 如果当前目录不为空
  if (list.filter(name => {
    const fileName = path.resolve(process.cwd(), path.join('.', name));
    const isDir = fs.statSync(fileName).isDirectory();
    return name.indexOf(projectName) !== -1 && isDir;
  }).length !== 0) {
    console.log(`项目${projectName}已经存在`);
    return;
  }
  next = Promise.resolve(projectName);
} else if (rootName === projectName) {
  next = inquirer.prompt([{
    name: 'buildInCurrent',
    message: '当前目录为空，且目录名称和项目名称相同，是否直接在当前目录下创建新项目？',
    type: 'confirm',
    default: true
  }]).then(answer => {
    return Promise.resolve(answer.buildInCurrent ? projectName : '.');
  })
} else {
  next = Promise.resolve(projectName);
}

const spinner = new Ora({
  text: 'Checking cli version'
});
const spinner2 = new Ora({
  text: 'Updating cli version'
});

spinner.start();
console.log('\ncli current version: ' + config.version)

latestVersion('twr-cli').then(version => {
  console.log('\ncli latest version: ' + version);
  spinner.frames = ['-', '+', '-'];
  spinner.color = 'yellow';
  spinner.text = 'Checked cli version done';
  spinner.succeed();
  // 比较当前版本与最新版本
  const ret = versionCompare(config.version, version);
  if(ret === -1) { // 当前版本比最新版本小，则更新
    spinner2.start();
    exec('npm install twr-cli -g', (err, stdout, stderr) => {
      if(err) {
        console.error(logSymbols.error, chalk.red(`\ntwr-cli install fail: ${err}`));
        spinner2.fail();
        process.exit(1);
      } else {
        console.log(stdout);
        spinner2.frames = ['-', '+', '-'];
        spinner2.color = 'yellow';
        spinner2.text = 'Updated cli version done';
        spinner2.succeed();
        next && go();
      }
    })
  }else{
    next && go();
  }
}).catch(err => {
  console.error(logSymbols.error, chalk.red(`\nerror：${err}`));
  process.exit(1);
});

function go() {
  next.then(projectRoot => {
    if (projectRoot !== '.') {
      fs.mkdirSync(projectRoot);
    }
    return download(projectRoot, program.repository).then(target => {
      return {
        name: projectRoot,
        root: projectRoot,
        target: target
      }
    });
  }).then(context => {
    const hostname = os.hostname();
    return inquirer.prompt([
      {
        name: 'name',
        message: '项目的名称',
        default: context.name
      }, {
        name: 'version',
        message: '项目的版本号',
        default: '1.0.0'
      }, {
        name: 'desc',
        message: '项目的简介',
        default: `A project named ${context.name}`
      }, {
        name: 'author',
        message: '项目的作者',
        default: hostname || ''
      }
    ]).then(answers => {
      return {
        ...context,
        metadata: {
          ...answers
        }
      }
    });
  }).then(context => {
    // 添加生成的逻辑
    return generator(context.metadata, context.target, path.parse(context.target).dir);
  }).then((res) => {
    // 成功用绿色显示，给出积极的反馈
    console.log(logSymbols.success, chalk.green('项目创建成功 ^_^'));
    console.log(chalk.green(`cd ${projectName}\nnpm install`));
  }).catch(err => {
    // 失败了用红色，增强提示
    console.error(logSymbols.error, chalk.red(`创建失败：${err}`));
    process.exit(1);
  });
}
