var React = require("react");
var ThemeManager = new(require("material-ui/lib/styles/theme-manager"))();

var injectTapEventPlugin = require("react-tap-event-plugin");

//Needed for onTouchTap
//Can go away when react 1.0 release
//Check this repo:
//https://github.com/zilverline/react-tap-event-plugin
injectTapEventPlugin();

import "./main.css";

import {Tabs, Tab} from "material-ui";

import SiteEditor from "./site-editor.jsx";
import BucketEditor from "./bucket-editor.jsx";
import UploadManager from "./upload-manager.jsx";

import API from "./api.js";
window.API = API;

var Main = React.createClass({
	childContextTypes: {
		muiTheme: React.PropTypes.object,
	},
	getChildContext() {
		return {
			muiTheme: ThemeManager.getCurrentTheme(),
		};
	},
	getInitialState() {
		var h = window.location.hash.slice(1);
		if (h !== "site" && h !== "buckets") {
			h = "site";
		}
		return {
			tab: h
		}
	},
	tabChange: function(tab,e){
		if (!tab || !e.target) {
			return;
		}
		window.location.hash = "#" + tab;
		this.setState({
			tab: tab
		});
	},
	render() {
		return <div><Tabs value={this.state.tab} onChange={this.tabChange}>
			<Tab label="Site" value="site"><SiteEditor /></Tab>
			<Tab label="Buckets" value="buckets"><BucketEditor /></Tab>
		</Tabs>
		<UploadManager />
		</div>
	}
});

module.exports = Main;
