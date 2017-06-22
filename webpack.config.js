const webpack = require('webpack');
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const autoprefixer = require('autoprefixer'); 
module.exports = {
    entry: './index.js',
    output: {
        path: __dirname + '/dist',
        filename: 'iDisqus.min.js',
        libraryTarget: 'umd',
        library: 'iDisqus'
    },

    module: {
        rules: [
            {
                test: /\.(scss|css)$/,
                use: ExtractTextPlugin.extract({
                    use:[ 'css-loader','sass-loader','postcss-loader'],
                    fallback: 'style-loader',
                }),
            },
        ],
    },
    plugins: [
        new webpack.LoaderOptionsPlugin({
            options: {
                postcss: [
                    autoprefixer(),
                ]
            }
        }),
        new ExtractTextPlugin('iDisqus.min.css'),
        new webpack.optimize.UglifyJsPlugin({
            beautify: false,
            comments: true,
            compress: {
                warnings: false,
                drop_console: true
            },
            mangle: {
                except: ['$'],
                screw_ie8 : true,
                keep_fnames: true
            }
        })
    ],
};
