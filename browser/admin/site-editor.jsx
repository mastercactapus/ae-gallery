import React from "react";
import Reflux from "reflux";
import {
	TextField,
	Table,
	TableRow,
	TableRowColumn,
	TableHeader,
	TableBody,
	TableHeaderColumn,
	FlatButton,
	FontIcon,
	Paper,
	Card,
	CardActions,
	CardTitle,
} from "material-ui"

import MetaStore from "./meta/store.js";
import MetaActions from "./meta/actions.js";
import FileActions from "./files/actions.js";


import { DragSource, DropTarget, DragDropContext } from "react-dnd"
import {NativeTypes} from "react-dnd/modules/backends/HTML5";

const LogoDropTarget = {
	drop(props, monitor) {
		var image = _.find(monitor.getItem().files, f=>{ return /^image/.test(f.type) });
		if (!image) return;
		FileActions.addFiles([image], p=>{
			p.then(file=>{
				MetaActions.editMeta({LogoURL: file[0].URL});
			});
		});
	}
}

@DropTarget(NativeTypes.FILE, LogoDropTarget, (connect, monitor)=>({ connectDropTarget: connect.dropTarget(), isOver: monitor.isOver() }))
class LogoEditor extends React.Component {
	constructor(props) {
		super(props);
	}

	render() {
		var style = {marginTop: 16, width: 800};
		var {connectDropTarget, isOver} = this.props;
		if (isOver) {
			style.backgroundColor = "lightblue";
		}

		var logoImage = <span></span>;
		if (this.props.URL) {
			logoImage = <img src={this.props.URL} />;
		}

		return connectDropTarget(<Card style={style}>
			<CardTitle title="Logo" subtitle="Drag image here to change" />
			<CardActions>
				{logoImage}
			</CardActions>
		</Card>)
	}
}

export default class SiteEditor extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
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

	render() {
		var textFieldStyle = {
			marginRight: 8
		};

		var links = _.map(this.state.meta.Links, (link, idx)=>{
			var delIcon = <FontIcon className="material-icons">delete</FontIcon>;
			return <TableRow key={idx} selectable={false}>
				<TableRowColumn><TextField
					onChange={e=>{link.Label=e.target.value; MetaActions.editMeta({Links: this.state.meta.Links})}}
					value={link.Label} /></TableRowColumn>
				<TableRowColumn><TextField
					onChange={e=>{link.URL=e.target.value; MetaActions.editMeta({Links: this.state.meta.Links})}}
					value={link.URL} /></TableRowColumn>
				<TableRowColumn><FlatButton
					onClick={e=>{this.state.meta.Links.splice(idx,1); MetaActions.editMeta({Links: this.state.meta.Links})}}
					label={delIcon} tooltip="Delete link" /></TableRowColumn>
			</TableRow>
		});

		return <div>
			<TextField
				style={textFieldStyle}
				value={this.state.meta.Title}
				onChange={e=>{MetaActions.editMeta({Title: e.target.value})}}
				floatingLabelText="Page Title" />
			<TextField
				style={textFieldStyle}
				value={this.state.meta.HeaderText}
				onChange={e=>{MetaActions.editMeta({HeaderText: e.target.value})}}
				floatingLabelText="Header Text" />
			<TextField
				style={textFieldStyle}
				value={this.state.meta.ContactEmail}
				onChange={e=>{MetaActions.editMeta({ContactEmail: e.target.value})}}
				floatingLabelText="Contact Email" />
			<br />
			<Card style={{width: 800, marginTop: 16}}>
			<CardTitle title="External Links" />
			<CardActions>
			<Table selectable={false}>
				<TableHeader>
					<TableRow>
						<TableHeaderColumn>Label</TableHeaderColumn>
						<TableHeaderColumn>URL</TableHeaderColumn>
						<TableHeaderColumn><FlatButton
							onClick={e=>{this.state.meta.Links.push({Label:"",URL:""}); MetaActions.editMeta({Links: this.state.meta.Links})}}
							label="Add" primary={true} /></TableHeaderColumn>
					</TableRow>
				</TableHeader>
				<TableBody displayRowCheckbox={false}>
				{links}
				</TableBody>
			</Table>
			</CardActions>
			</Card>
			<LogoEditor URL={this.state.meta.LogoURL} />
		</div>
	}

}

module.exports = SiteEditor;
