const webpack = require('webpack')
const HtmlWebpackInlineSourcePlugin = require('html-webpack-inline-source-plugin'); //Bundles into one file
const RemovePlugin = require('remove-files-webpack-plugin'); //Cleans up dist folder on build
const HtmlWebpackPlugin = require('html-webpack-plugin'); //Bundles HTML
const { VueLoaderPlugin } = require('vue-loader'); //Makes vue Work
const CreateFileWebpack = require('create-file-webpack') //Used to create the manifest.json
const path = require('path');

module.exports = (env, argv) => ({
	// This is necessary because Figma's 'eval' works differently than normal eval
	devtool: argv.mode === 'production' ? false : 'inline-source-map',

	entry: {
		ui: './src/ui.ts', // The entry point for your UI code
		code: './src/code.ts' // The entry point for your plugin code
	},

	module: {
		rules: [
			// Converts TypeScript code to JavaScript
			{
				test: /\.tsx?$/,
				loader: 'ts-loader',
				exclude: /node_modules/,
				options: {
					appendTsSuffixTo: [/\.vue$/]
				}
			},

			// Enables including CSS by doing "import './file.css'" in your TypeScript code
			{ test: /\.css$/, loader: [{ loader: 'style-loader' }, { loader: 'css-loader' }] },
			{
				test: /\.scss$/,
				use: [
					{
						loader: 'style-loader'
					},
					{
						loader: 'css-loader'
					},
					{
						loader: 'sass-loader',
						options: {
							implementation: require('sass')
						}
					}
				]
			},

			{
				test: /\.pug$/,
				loader: 'pug-plain-loader'
			},

			{
				test: /\.vue$/,
				loader: 'vue-loader'
			},

			// Allows you to use "<%= require('./file.svg') %>" in your HTML code to get a data URI
			{ test: /\.(png|jpg|gif|webp|svg)$/, loader: [{ loader: 'url-loader' }] }
		]
	},

	// Webpack tries these extensions for you if you omit the extension like "import './file'"
	resolve: { extensions: ['.tsx', '.ts', '.jsx', '.js'] },

	output: {
		filename: '[name].js',

		path: path.resolve(__dirname, 'builds/'+argv.mode) // Compile into a folder called "dist"
	},

	// Tells Webpack to generate "ui.html" and to inline "ui.ts" into it
	plugins:
		argv.mode === 'production'
			? [
					new webpack.DefinePlugin({
						BUILD_MODE: JSON.stringify("production")
					  }),
					new VueLoaderPlugin(),
					new RemovePlugin({
						after: { include: ['builds/production/ui.js'] }
					}),
					new HtmlWebpackPlugin({
						template: './src/ui.html',
						filename: 'ui.html',
						inlineSource: '.(js|css|scss)$',
						chunks: ['ui']
					}),
					new HtmlWebpackInlineSourcePlugin(),
					new CreateFileWebpack({
						path: path.resolve(__dirname, 'builds/'+argv.mode),
						fileName: 'manifest.json',
						content: JSON.stringify(
							{
								"name": "Organiser",
								"api": "1.0.0",
								"main": "code.js",
								"ui": "ui.html",
								"id": "918926326416353608"
							}
							
						),
					  })
			  ]
			: [
				new webpack.DefinePlugin({
					BUILD_MODE: JSON.stringify("dev")
				  }),
					new VueLoaderPlugin(),
					new HtmlWebpackPlugin({
						template: './src/ui.html',
						filename: 'ui.html',
						inlineSource: '.(js|css|scss)$',
						chunks: ['ui']
					}),
					new HtmlWebpackInlineSourcePlugin(),
					new CreateFileWebpack({
						path: path.resolve(__dirname, 'builds/'+argv.mode),
						fileName: 'manifest.json',
						content: JSON.stringify(
							{
								"name": "Organiser Development Build",
								"api": "1.0.0",
								"main": "code.js",
								"ui": "ui.html",
								"id": "918926326416353608"
							}
							
						),
					  })
			  ]
});
