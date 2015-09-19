import React from "react";
import Reflux from "reflux";
import {TextField} from "material-ui"

import MetaStore from "./meta/store.js";
import MetaActions from "./meta/actions.js";

var SiteEditor = React.createClass({
	mixins: [Reflux.connect(MetaStore, "meta")],
	getInitialState() {
		return {
			meta: MetaStore.get(),
		}
	},
	componentWillMount() {
		MetaActions.loadMeta();
	},
	onTitleChange(e) {
		MetaActions.setTitle(e.target.value)
	},
	render() {
		return <TextField value={this.state.meta.Title} onChange={this.onTitleChange} floatingLabelText="Page Title" />
	}

});

module.exports = SiteEditor;
