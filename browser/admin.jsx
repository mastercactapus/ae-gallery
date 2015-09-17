var React = require("react");
var Main = require("./admin/main.jsx");

document.onreadystatechange = function() {
	if (document.readyState==="complete") {
		React.render(<Main />, document.body);
	}
};
