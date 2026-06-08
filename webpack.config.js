import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default {
	mode: 'production',
	context: __dirname + '/src/',
	entry: './assets/js/index.js',
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
			}
		]
	},
	optimization: {
		minimize: true
	},
	output: {
		path: path.resolve(__dirname, 'docs/assets/js/'),
		filename: 'main.bundle.js'
	}
};
