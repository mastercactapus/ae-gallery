var path = require("path");
var ExtractTextPlugin = require("extract-text-webpack-plugin");
var webpack = require("webpack");

module.exports = {
	entry: {
		"main-bundle.js": [
			path.resolve(__dirname, "browser/main.js"),
			path.resolve(__dirname,"browser/lib/materialize-src/sass/materialize.scss"),
			path.resolve(__dirname,"browser/lib/materialize-src/js/bin/materialize.js"),
		],
		"admin-bundle.js": path.resolve(__dirname, "browser/admin.jsx"),
	},
	output: {
		path: path.resolve(__dirname, "public"),
		filename: "[name]"
	},
	plugins: [
		new webpack.ProvidePlugin({
			$: "jquery",
			jQuery: "jquery",
			"window.jQuery": "jquery",
			"window.$": "jquery",
		})
	],
	module: {
		loaders: [
			{ test: /\.jsx?$/, include: path.join(__dirname, "browser"), exclude: path.join(__dirname, "browser/lib"), loader: "babel", query: { stage: 0 } },
			{ test: /\.css$/, loader: "style!css" },
			{ test: /\.scss$/, loader: "style!css!sass?includePaths[]=" + encodeURIComponent(path.resolve(__dirname, "browser/lib/materialize-src/sass")) },
			{ test: /\.(svg|eot|woff2?|ttf|png|gif)$/, loader: "url?limit=1024" },
		]
	}
};
