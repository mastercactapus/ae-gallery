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
	Paper,
	CircularProgress,
	Snackbar,
} from "material-ui";

import MetaStore from "./meta/store.js";
import MetaActions from "./meta/actions.js";
import BucketStore from "./buckets/store.js";
import BucketActions from "./buckets/actions.js";
import ImageStore from "./images/store.js";
import ImageActions from "./images/actions.js";

import { DragSource, DropTarget, DragDropContext } from "react-dnd"
import {NativeTypes} from "react-dnd/modules/backends/HTML5";

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

const uploadTarget = {
	drop(props, monitor) {
		var images = _.filter(monitor.getItem().files, f=>{ return /^image/.test(f.type) });
		if (images.length === 0) return;
		ImageActions.addImages(props.ID, images);
	}
};

const imageSource = {
	beginDrag(props) {
		return {
			ID: props.ID,
			index: props.index,
			bucketID: props.bucketID,
		}
	}
};
const imageTarget = {
	hover(props, monitor, component) {
		const item = monitor.getItem();
		if (item.bucketID !== props.bucketID) return;
		if (item.ID === props.ID) return;
		BucketActions.reorderImage(props.bucketID, item.ID, props.ID);
	}
};
const imageBucketTarget = {
	drop(props, monitor) {
		var item = monitor.getItem();
		if (props.ID === item.bucketID) return;
		BucketActions.moveImage(item.ID, item.bucketID, props.ID);
	}
}


const deleteTarget = {
	drop(props, monitor, component) {
		var type = monitor.getItemType();
		if (type === "bucket") {
			BucketActions.removeBucket(monitor.getItem().ID);
		} else if (type === "image") {
			ImageActions.removeImage(monitor.getItem().ID);
		} else {
			console.error("Unknown type sent to delete target:", type);
		}
	}
};

@DropTarget(["bucket", "image"], deleteTarget, (connect, monitor)=>({ connectDropTarget: connect.dropTarget(), isOver: monitor.isOver() }))
export class DeleteZone extends React.Component {
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
			textAlign: "center"
		};
		if (isOver) {
			style.color = "red";
		}

		var iconStyle = { color: style.color, fontSize: style.fontSize }

		return connectDropTarget(<Paper style={style}><FontIcon style={iconStyle} className="material-icons">delete</FontIcon> Delete</Paper>);
	}
}

@DropTarget("image", imageTarget, connect=>({ connectDropTarget: connect.dropTarget() }))
@DragSource("image", imageSource, (connect, monitor) => ({ connectDragPreview: connect.dragPreview(), connectDragSource: connect.dragSource(), isDragging: monitor.isDragging() }))
export class Image extends React.Component {
	static propTypes = {
		connectDragSource: PropTypes.func.isRequired,
		connectDropTarget: PropTypes.func.isRequired,
		ID: PropTypes.string.isRequired,
		index: PropTypes.number.isRequired,
		bucketID: PropTypes.string.isRequired,
		isDragging: PropTypes.bool.isRequired,
	}
	constructor(props) {
		super(props);
		this.state={};
	}
	componentDidMount() {
		this.setState(ImageStore.get(this.props.ID));
		this.unsubscribeImage = ImageStore.listen(images => {
			var b = images[this.props.ID];
			if (!b) return;
			this.setState(b);
		});
	}

	componentWillUnmount() {
		this.unsubscribeImage();
	}
	changeEnabled(e,t) {
		ImageActions.setImageEnabled(this.state.ID, t);
		e.stopPropagation();
	}
	changeName(e) {
		ImageActions.setImageName(this.state.ID, e.target.value);
		e.stopPropagation();
	}
	changeCaption(e) {
		ImageActions.setImageCaption(this.state.ID, e.target.value);
		e.stopPropagation();
	}

	render() {
		const { connectDragPreview, connectDragSource, connectDropTarget, isDragging } = this.props;
		var ID = this.props.ID;
		var thumbURL = this.state.URL+"=s128";
		var style = {width:180,display: "inline-block"};
		var cStyle = {width:"100%"};

		style.opacity = isDragging ? 0.3 : 1;
		var image = connectDragSource(<div style={{height:128,width:128}}><img src={thumbURL} /></div>);
		var body = connectDropTarget(connectDragPreview(<Paper style={{...style, margin: 4, padding: 4}}>
				{image}
					<Toggle style={cStyle} label="Enabled" defaultToggled={this.state.Enabled} onToggle={this.changeEnabled.bind(this)} />
					<TextField style={cStyle} floatingLabelText="Name" onChange={this.changeName.bind(this)} value={this.state.Name} />
					<TextField style={cStyle} floatingLabelText="Caption" onChange={this.changeCaption.bind(this)} value={this.state.Caption} multiLine={true} />
			</Paper>), {dropEffect: 'move'});
		var deleteZone = "";
		if (isDragging) {
			deleteZone = <DeleteZone />;
		}


		return <span>{body}<span>{deleteZone}</span></span>
	}
}
@DropTarget("image", imageBucketTarget, (connect, monitor) => ({ connectImageTarget: connect.dropTarget(), isImageOver: monitor.isOver(), imageItem: monitor.getItem() }))
@DropTarget("bucket", bucketTarget, connect => ({ connectDropTarget: connect.dropTarget() }))
@DropTarget(NativeTypes.FILE, uploadTarget, (connect, monitor)=>({ connectUploadTarget: connect.dropTarget(), isUploadOver: monitor.isOver() }))
@DragSource("bucket", bucketSource, (connect, monitor) => ({ connectDragPreview: connect.dragPreview(), connectDragSource: connect.dragSource(), isDragging: monitor.isDragging() }))
export class Bucket extends React.Component {
	static propTypes = {
		connectDragSource: PropTypes.func.isRequired,
		connectDropTarget: PropTypes.func.isRequired,
		isDragging: PropTypes.bool.isRequired,
		ID: PropTypes.string.isRequired,
		index: PropTypes.number.isRequired,
	}
	constructor(props) {
		super(props);
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
		var ID = this.props.ID;
		const { isDragging, isUploadOver, connectDragSource, connectDropTarget, connectDragPreview, connectUploadTarget, connectImageTarget, isImageOver, imageItem } = this.props;
		const opacity = isDragging ? 0.3 : 1;
		var icon;
		if (this.state.Missing) {
			icon = <CircularProgress mode="indeterminate" size={0.3} />
		} else {
			icon = <FontIcon className="bucket-drag material-icons">reorder</FontIcon>;
		}
		icon = connectDragSource(icon);

		var deleteZone;
		if (isDragging) {
			deleteZone = <DeleteZone />;
		}
		var allowImage = isImageOver && (imageItem.bucketID != ID);
		var style = {opacity};
		if (isUploadOver || allowImage) {
			style.background = "lightblue";
		}

		var images = _.map(this.state.Images, (img,idx)=>{ return <Image key={img} ID={img} index={idx} bucketID={ID} /> });
		var body = connectImageTarget(connectUploadTarget(connectDragPreview(connectDropTarget(<Card style={style} className="bucket" initiallyExpanded={false}>
			<CardHeader
				className="bucket-header"
				title={this.state.Name}
				subtitle={this.state.Caption}
				showExpandableButton={true}
				avatar={icon} />
			<CardActions style={{width:200,display: 'inline-block'}} expandable={true}>
				<Toggle label="Enabled" defaultToggled={this.state.Enabled} onToggle={(e,t)=>{ BucketActions.setBucketEnabled(ID, t); e.stopPropagation() }} />
				<TextField floatingLabelText="Name" onChange={e=>{ BucketActions.setBucketName(ID, e.target.value); e.stopPropagation() }} value={this.state.Name} />
				<TextField floatingLabelText="Caption" onChange={e=>{ BucketActions.setBucketCaption(ID, e.target.value); e.stopPropagation() }} value={this.state.Caption} multiLine={true} />
			</CardActions>
			<CardActions style={{display: 'inline-block', margin: 20, minHeight: 240}} expandable={true}>
				<Paper>{images}</Paper>
			</CardActions>
		</Card>), {dropEffect: 'move'})));

		return <div>{body}<div>{deleteZone}</div></div>;
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

