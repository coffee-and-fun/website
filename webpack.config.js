const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const HTMLInlineCSSWebpackPlugin = require('html-inline-css-webpack-plugin').default;

module.exports = {
	mode: 'production',
	context: __dirname + '/src/',
	entry: ['./assets/js/index.js', './assets/css/styles.css'],
	plugins: [new MiniCssExtractPlugin({ ignoreOrder: false }), new HTMLInlineCSSWebpackPlugin()],
	resolve: {
		alias: {
			vue: 'vue/dist/vue.min.js'
		}
	},
	module: {
		rules: [
			{
				test: /\.mp4$/,
				type: 'asset/resource',
				generator: {
					filename: 'videos/[name][ext]'
				}
			},
			{
				test: /\.mp3$/,
				type: 'asset/resource',
				generator: {
					filename: 'audio/[name][ext]'
				}
			},
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: [
					{
						loader: 'babel-loader',
						options: {
							presets: ['@babel/preset-env']
						}
					}
				]
			},
			{
				test: /\.(woff(2)?|ttf|eot)(\?v=\d+\.\d+\.\d+)?$/,
				type: 'asset/resource',
				generator: {
					filename: 'fonts/[name][ext]',
					publicPath: 'fonts/icons/'
				}
			},
			{
				test: /\.(png|jpe?g|gif|xml|ico|svg|webmanifest)$/i,
				type: 'asset/resource',
				generator: {
					filename: 'docs/[name][ext]'
				}
			},
			{
				test: /\.css$/,
				use: [
					'style-loader',
					'css-loader',
					{
						loader: 'postcss-loader'
					}
				]
			}
		]
	},
	optimization: {
		minimize: true,
		minimizer: [
			'...',
			new CssMinimizerPlugin()
		]
	},
	output: {
		path: path.resolve(__dirname, 'docs/assets/js/'),
		filename: 'main.bundle.js'
	}
};
