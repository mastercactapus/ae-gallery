import React, {PropTypes} from "react";
import UploadStore from "./uploads/store.js";
import {LinearProgress} from "material-ui";

class Upload extends React.Component {
	static propTypes = {
		ID: PropTypes.string.isRequired,
	};

	constructor(props) {
		super(props);
		this.state = UploadStore.get(props.ID);
	}
	componentDidMount() {
		this.setState(UploadStore.get(this.props.ID));
		this.unsubscribeUploads = UploadStore.listen(uploads => {
			var b = uploads[this.props.ID];
			if (!b) return;
			this.setState(b);
		});
	}

	componentWillUnmount() {
		this.unsubscribeUploads();
	}

	render() {
		return <div>
			{this.state.name}
			<LinearProgress max={this.state.max} value={this.state.pos} />
		</div>
	}
}

export default class UploadManager extends React.Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	render() {
		var uploads = _.map(UploadStore.getAll(), up=>{ return <Upload key={up.ID} ID={up.ID} /> });

		var style = {
			position: "fixed",
			bottom: 0,
			right: 0,
			width: 200,
			zIndex:999,
			padding: 16,
		};
		return <div style={style}>
			Uploads
			<hr />
			{uploads}
		</div>
	}
}
