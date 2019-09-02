/*
 * @description: generate project files
 * @author: tracyqiu
 * @LastEditors: tracyqiu
 * @LastEditTime: 2019-09-02 17:24:46
 */
const Metalsmith = require('metalsmith');
const rm = require('rimraf').sync;

module.exports = function(metadata = {}, src, dest = '.') {
  if (!src) {
    return Promise.reject(new Error(`无效的source：${src}`));
  }

  return new Promise((resolve, reject) => {
    Metalsmith(process.cwd())
      .metadata(metadata)
      .clean(false)
      .source(src)
      .destination(dest)
      .use((files, metalsmith, done) => {
        const meta = metalsmith.metadata();
          // 目前仅定义替换package.json文件
        Object.keys(files)
          .filter(x => x.includes('package.json'))
          .forEach(fileName => {
            const file = JSON.parse(files[fileName].contents.toString());
            file.version = meta.version;
            file.name = meta.name;
            file.author = meta.author;
            file.description = meta.desc;
            files[fileName].contents = new Buffer.from(JSON.stringify(file));
          });
        done();
      }).build(err => {
        rm(src);
        err ? reject(err) : resolve();
      });
  });
}
