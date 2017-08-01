const webpack = require('webpack');
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const autoprefixer = require('autoprefixer'); 
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
                    use:[ 'css-loader','sass-loader','postcss-loader'],
                    fallback: 'style-loader',
                }),
            },
            {
                test: /\.json$/,
                use:[ 'file-loader?name=[name].min.json', require.resolve('./src/jsonminify')],
            }
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
                drop_console: false
            },
            mangle: {
                except: ['$'],
                screw_ie8 : true,
                keep_fnames: true
            }
        })
    ],
};
