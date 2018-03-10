const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const autoprefixer = require('autoprefixer'); 
const UglifyJSPlugin = require('uglifyjs-webpack-plugin')

module.exports = {
    entry: {
        'iDisqus': './index.js',
    },
    output: {
        path: __dirname + '/dist',
        filename: '[name].min.js',
        libraryTarget: 'umd',
        library: '[name]'
    },

    module: {
        rules: [
            {
                test: /\.(scss|css)$/,
                use: ExtractTextPlugin.extract({
                    use:[
                        'css-loader',
                        'sass-loader',
                        {loader: 'postcss-loader', options: { plugins: () => [ require('autoprefixer') ] }}
                    ],
                    fallback: 'style-loader'
                }),
            },
            {
                test: /\.html$/,
                use: [{
                    loader: 'file-loader',
                    options: {
                        name: '[name].[ext]'
                    }  
                }]
            }
        ],
    },
    plugins: [
        new ExtractTextPlugin('iDisqus.min.css')
    ],
    optimization: {
        minimizer: [
            new UglifyJSPlugin({
                uglifyOptions: { 
                    warnings: false,
                    output: {
                        comments: false,
                        beautify: false,
                    },
                    ie8: false
                }
            })
        ]
    }
};
