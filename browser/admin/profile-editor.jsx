import React from "react";

import brace from "brace";
import AceEditor from "react-ace";
require("brace/mode/markdown");
require("brace/theme/github");
import {Card, TextField, CardTitle, CardActions, FlatButton, Table, TableHeader, TableRow, TableHeaderColumn, TableRowColumn, TableBody, FontIcon} from "material-ui";

import FileStore from "./files/store.js";
import FileActions from "./files/actions.js";
import MetaStore from "./meta/store.js";
import MetaActions from "./meta/actions.js";


import { DragSource, DropTarget, DragDropContext } from "react-dnd"
import {NativeTypes} from "react-dnd/modules/backends/HTML5";

const FileDropTarget = {
	drop(props, monitor) {
		FileActions.addFiles(monitor.getItem().files);
	}
}

@DropTarget(NativeTypes.FILE, FileDropTarget, (connect, monitor)=>({ connectDropTarget: connect.dropTarget(), isOver: monitor.isOver() }))
class FileEditor extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			files: FileStore.getAll()
		};
	}

	componentDidMount() {
		this.setState(FileStore.getAll());
		this.unsubscribeFiles = FileStore.listen(files => {
			this.setState({files});
		});
	}

	componentWillUnmount() {
		this.unsubscribeFiles();
	}

	render() {
		var {isOver, connectDropTarget} = this.props;

		var files = _.map(this.state.files, (file, idx)=>{
			var delIcon = <FontIcon className="material-icons">delete</FontIcon>;
			return <TableRow key={idx} selectable={false}>
				<TableRowColumn>{file.Name}</TableRowColumn>
				<TableRowColumn><TextField value={file.URL} /></TableRowColumn>
				<TableRowColumn><FlatButton
					onClick={e=>{FileActions.removeFile(file.ID)}}
					label={delIcon} /></TableRowColumn>
			</TableRow>
		});
		var style = {position: "absolute", left:620, top: 20, width: 800};
		if (isOver) {
			style.backgroundColor = "lightblue";
		}

		return connectDropTarget(<Card style={style}>
		<CardTitle title="Available Files" subtitle="Drop files here to upload" />
			<CardActions>
			<Table selectable={false}>
				<TableHeader>
					<TableRow>
						<TableHeaderColumn>Name</TableHeaderColumn>
						<TableHeaderColumn>URL</TableHeaderColumn>
						<TableHeaderColumn></TableHeaderColumn>
					</TableRow>
				</TableHeader>
				<TableBody displayRowCheckbox={false}>
				{files}
				</TableBody>
			</Table>
			</CardActions>
		</Card>);
	}
}

export default class ProfileEditor extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			loaded: false,
			meta: MetaStore.get()
		};
	}

	componentDidMount() {
		this.setState(MetaStore.get());
		this.unsubscribeMeta = MetaStore.listen(meta => {
			this.setState({meta});
		});
	}

	componentWillUnmount() {
		this.unsubscribeMeta();
	}

	updateProfile(val) {
		if (!this.state.loaded) return;
		MetaActions.editMeta({Profile: val})
	}
	editorLoad() {
		this.setState({loaded: true});
	}

	render() {
		return <div>
			<AceEditor width={600} mode="markdown" value={this.state.meta.Profile} editorProps={{$blockScrolling: true}} theme="github" name="profileEdit" />
			<FileEditor />
			</div>
	}
}
