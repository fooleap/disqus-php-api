var ExtractTextPlugin = require("extract-text-webpack-plugin");
module.exports = {
    entry: './src/main.js',
    output: {
        filename: 'disqus-api.js'       
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
        new ExtractTextPlugin("disqus-api.css"),
    ],
};
