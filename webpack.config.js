var path = require("path");

module.exports = {
	entry: {
		"main": path.resolve(__dirname, "browser/main.js"),
		"admin": path.resolve(__dirname, "browser/admin.jsx"),
	},
	output: {
		path: path.resolve(__dirname, "public"),
		filename: "[name]-bundle.js"
	},
	module: {
		loaders: [
			{ test: /\.jsx?$/, loader: "babel-loader" }
		]
	}
};
