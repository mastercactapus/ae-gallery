import React from "react";
import Reflux from "reflux";
import _ from "lodash";
import {Card, CardHeader, TextField, FlatButton, Avatar, CardActions, FontIcon, Toggle} from "material-ui";

import MetaStore from "./meta/store.js";
import MetaActions from "./meta/actions.js";
import BucketStore from "./buckets/store.js";
import BucketActions from "./buckets/actions.js";

import { DragSource, DropTarget } from "react-dnd"

export class Bucket extends React.Component {
	constructor() {
		super();
		this.state = {};
	}

	componentDidMount() {
		this.setState(BucketStore.get(this.props.ID));
		this.unsubscribeBucket = BucketStore.listen(buckets => {
			var b = buckets[this.props.ID];
			if (!b) return;
			this.setState(b);
		});
	}

	componentWillUnmount() {
		this.unsubscribeBucket();
	}

	render() {
		var icon = <FontIcon className="material-icons">reorder</FontIcon>;

		return <Card initiallyExpanded={false}>
			<CardHeader
				className="bucket-header"
				title={this.state.Name}
				subtitle={this.state.Caption}
				showExpandableButton={true}
				avatar={icon} />
		</Card>
	}
}

export default class BucketEditor extends React.Component {
	constructor() {
		super();
		this.state = {
			Title: "",
			Buckets: [],
			newName: "",
		};
	}

	componentWillMount() {
		MetaActions.loadMeta();
		BucketActions.loadBuckets();
	}

	componentDidMount() {
		this.unsubscribeMeta = MetaStore.listen(meta => {this.setState(meta)});
	}

	componentWillUnmount() {
		this.unsubscribeMeta();
	}

	createBucket() {
		var name = this.state.newName.trim();
		this.setState({
			newName: ""
		});
		BucketActions.addBucket({Name: name});
	}

	newNameChange(e) {
		this.setState({
			newName: e.target.value
		});
	}

	render() {
		var buckets = _.map(this.state.Buckets, id=>{
			return <Bucket key={id} ID={id} />
		});

		return <div>
			<div>
				<TextField floatingLabelText="Bucket name" value={this.state.newName} onChange={this.newNameChange} />
				<FlatButton label="Create New" primary={true} disabled={this.state.newName.length === 0} onClick={this.createBucket} />
			</div>
			{buckets}
		</div>
	}
}

