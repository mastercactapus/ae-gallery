import React, {PropTypes} from "react";
import UploadStore from "./uploads/store.js";
import {LinearProgress, Paper} from "material-ui";

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
			console.log(b)
			if (!b) return;
			this.setState(b);
		});
	}

	componentWillUnmount() {
		this.unsubscribeUploads();
	}

	render() {
		var mode = this.state.size > 0 ? "determinate" : "indeterminate";
		return <Paper style={{marginTop: 6, padding: 4}}>
			{this.state.name}
			<LinearProgress max={this.state.size} value={this.state.pos} mode={mode} />
		</Paper>
	}
}

export default class UploadManager extends React.Component {
	constructor(props) {
		super(props);
		this.state = {uploads:[]};
	}
	componentDidMount() {
		this.setState({uploads: UploadStore.getAll()});
		this.unsubscribeUploads = UploadStore.listen(uploads => {
			this.setState({uploads});
		});
	}

	componentWillUnmount() {
		this.unsubscribeUploads();
	}

	render() {
		var uploads = _.map(this.state.uploads, (up, key)=>{ return <Upload key={key} ID={key} /> });

		if (uploads.length === 0) {
			return <span></span>;
		}

		var style = {
			position: "fixed",
			bottom: 0,
			right: "4em",
			width: 200,
			zIndex:999,
			padding: 16,
		};
		return <Paper style={style}>
			Uploads
			<hr />
			{uploads}
		</Paper>
	}
}
