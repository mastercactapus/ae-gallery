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
			{ test: /\.jsx?$/, include: path.join(__dirname, "browser"), loader: "babel", query: { stage: 0 } },
			{ test: /\.css$/, loader: "style!css" },
			{ test: /\.scss$/, loader: "style!css!sass"},
			{ test: /\.(svg|eot|woff2?|ttf|png|gif)$/, loader: "url" },
		]
	}
};
