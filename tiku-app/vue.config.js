const path = require('path')

module.exports = {
  devServer: {
    // H5模式下让 /data/ 路径指向项目根目录的 data 文件夹
    static: {
      directory: path.join(__dirname, 'data'),
      publicPath: '/data'
    }
  }
}
