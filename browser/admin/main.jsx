var React = require("react");
var ThemeManager = new(require("material-ui/lib/styles/theme-manager"))();

import {Card, CardHeader, CardActions} from "material-ui/lib/card";
import TextField from "material-ui/lib/text-field";
import FlatButton from "material-ui/lib/flat-button";


var Main = React.createClass({
	childContextTypes: {
		muiTheme: React.PropTypes.object,
	},
	getChildContext() {
		return {
			muiTheme: ThemeManager.getCurrentTheme(),
		};
	},

	render() {
		return <Card initiallyExpanded={false}>
			<CardHeader
				title="Foo"
				subtitle="yeah woot"
				showExpandableButton={true}/>

				<CardActions expandable={true}>
					<TextField floatingLabelText="Name" />
					<TextField floatingLabelText="Caption" multiline={true} />
				</CardActions>
				<CardActions expandable={true}>
					<FlatButton label="Cancel" secondary={true} />
					<FlatButton label="Save" primary={true} />
				</CardActions>


		</Card>
	}
});

module.exports = Main;
