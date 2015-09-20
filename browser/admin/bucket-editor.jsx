import React, { PropTypes } from "react";
import Reflux from "reflux";
import _ from "lodash";
import {
	Card,
	CardHeader, 
	TextField, 
	FlatButton, 
	Avatar, 
	CardActions, 
	FontIcon, 
	Toggle,
	CircularProgress,
} from "material-ui";

import MetaStore from "./meta/store.js";
import MetaActions from "./meta/actions.js";
import BucketStore from "./buckets/store.js";
import BucketActions from "./buckets/actions.js";

import { DragSource, DropTarget, DragDropContext } from "react-dnd"
import HTML5Backend from "react-dnd/modules/backends/HTML5";

const bucketSource = {
	beginDrag(props) {
		return {
			ID: props.ID,
			index: props.index,
		};
	}
};
const bucketTarget = {
	hover(props, monitor, component) {
		const ownId = props.ID;
		const draggedId = monitor.getItem().ID;
		if (draggedId == ownId) {
			return;
		}

	  	MetaActions.reorderBucket(draggedId, ownId);
	}
};
const deleteBucketTarget = {
	drop(props, monitor, component) {
		BucketActions.removeBucket(monitor.getItem().ID);
	}
};

@DropTarget("bucket", deleteBucketTarget, (connect, monitor)=>({ connectDropTarget: connect.dropTarget(), isOver: monitor.isOver() }))
export class DeleteBucket extends React.Component {
	render() {
		const { connectDropTarget, isOver } = this.props;

		var style = {
			position: "fixed",
			top: 0,
			left: 0,
			right: 0,
			fontSize: 64,
			background: "white",
			zIndex: 9999,
		};
		if (isOver) {
			style.color = "red";
		}

		var iconStyle = { color: style.color, fontSize: style.fontSize }

		return connectDropTarget(<center style={style}><FontIcon style={iconStyle} className="material-icons">delete</FontIcon> Delete</center>);
	}
}

@DropTarget("bucket", bucketTarget, connect => ({ connectDropTarget: connect.dropTarget() }))
@DragSource("bucket", bucketSource, (connect, monitor) => ({ connectDragPreview: connect.dragPreview(), connectDragSource: connect.dragSource(), isDragging: monitor.isDragging() }))
export class Bucket extends React.Component {
	static propTypes = {
		connectDragSource: PropTypes.func.isRequired,
		connectDropTarget: PropTypes.func.isRequired,
		isDragging: PropTypes.bool.isRequired,
		ID: PropTypes.string.isRequired,
		index: PropTypes.number.isRequired,
	}
	constructor() {
		super();
		this.state = {};
	}

	componentDidMount() {
		this.setState(BucketStore.get(this.props.ID));
		this.unsubscribeBucket = BucketStore.listen(buckets => {
			var b = buckets[this.props.ID];
			if (!b) return;
			b.Missing = false;
			this.setState(b);
		});
	}

	componentWillUnmount() {
		this.unsubscribeBucket();
	}

	render() {
		const { isDragging, connectDragSource, connectDropTarget, connectDragPreview } = this.props;
		const opacity = isDragging ? 0 : 1;
		var icon;
		if (this.state.Missing) {
			icon = <CircularProgress mode="indeterminate" size={0.3} />
		} else {
			icon = <FontIcon className="bucket-drag material-icons">reorder</FontIcon>;
		}
		icon = connectDragSource(icon);

		var deleteZone;
		if (isDragging) {
			deleteZone = <DeleteBucket />;
		}

		var ID = this.state.ID;

		return connectDragPreview(connectDropTarget(<div><Card style={{ opacity }} className="bucket" initiallyExpanded={false}>
			<CardHeader
				className="bucket-header"
				title={this.state.Name}
				subtitle={this.state.Caption}
				showExpandableButton={true}
				avatar={icon} />
			<CardActions style={{width:200,display: 'inline-block'}} expandable={true}>
				<Toggle label="Enabled" defaultToggled={this.state.Enabled} onToggle={(e,t)=>{ BucketActions.setEnabled(ID, t) }} />
				<TextField floatingLabelText="Name" onChange={e=>{ BucketActions.setName(ID, e.target.value) }} value={this.state.Name} />
				<TextField floatingLabelText="Caption" onChange={e=>{ BucketActions.setCaption(ID, e.target.value) }} value={this.state.Caption} multiLine={true} />
			</CardActions>
		</Card><div>{deleteZone}</div></div>), {dropEffect: 'move'})
	}
}

@DragDropContext(HTML5Backend)
export default class BucketEditor extends React.Component {
	constructor() {
		super();
		this.state = {
			Title: "",
			Buckets: [],
			newName: "",
		};
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
		var buckets = _.map(this.state.Buckets, (id,index)=>{
			return <Bucket key={id} index={index} ID={id} />
		});

		return <div>
			<div>
				<TextField floatingLabelText="Bucket name" value={this.state.newName} onChange={this.newNameChange.bind(this)} />
				<FlatButton label="Create New" primary={true} disabled={this.state.newName.length === 0} onClick={this.createBucket.bind(this)} />
			</div>
			{buckets}
		</div>
	}
}

