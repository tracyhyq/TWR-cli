/*
 * @description: download template
 * @author: tracyqiu
 * @LastEditors: tracyqiu
 * @LastEditTime: 2019-09-02 14:55:58
 */
const path = require('path');
const ora = require('ora');
const download = require('download-git-repo');

module.exports = function (target, url) {
  target = path.join(target || '.', '.download-temp');
  return new Promise((resolve, reject) => {
    const spinner = ora(`downloading template，origin source：https://github.com/${url}`);
    spinner.start();
    download(url, target, (err) => {
      if (err) {
        spinner.fail();
        reject(err);
      } else {
        // 下载的模板存放在一个临时路径中，下载完成后，可以向下通知这个临时路径，以便后续处理
        spinner.succeed();
        resolve(target);
      }
    });
  });
}
