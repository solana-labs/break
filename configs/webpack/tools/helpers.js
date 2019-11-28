const path = require('path');
const fs = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const paths = require('./paths');

//process cwd возвращает текущую рабочую директорию Node.js (там где папка node_modules);
const appDirectory = fs.realpathSync(process.cwd());

//helper для получения пути относительно корня каталога (appDirectory)
const resolvePath = relativePath => path.resolve(appDirectory, relativePath);

module.exports = {
    htmlWebpackPluginHelper: function(config) {
        return [new HtmlWebpackPlugin({
            ...config,
            inject: true,
            filename: 'index.html',
            template: resolvePath(`${paths.source}/index.html`),
            chunks: 'bundle',
            base: '/'
        })];
    },
    resolvePath,
    appDirectory
}
