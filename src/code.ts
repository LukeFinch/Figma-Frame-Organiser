//Types
interface Spacing {
	vertical: number,
	horizontal: number
}

var leftFrame = null
var rowCount
var layout = []


import { dispatch, handleEvent } from './codeMessageHandler';
figma.showUI(__html__);
figma.ui.resize(400,400);
//Send selection length on launch
let frames = figma.currentPage.selection.filter(sel => sel.type == "FRAME" || sel.type == "COMPONENT")
dispatch('updateSelectionCount',frames.length)
dispatch('viewport',figma.viewport.bounds)

// The following shows how messages from the UI code can be handled in the main code.
figma.on("selectionchange", () => {
	const frames = figma.currentPage.selection.filter(sel => sel.type == "FRAME")
	dispatch('updateSelectionCount',frames.length)
})

handleEvent("resizeUI", (size) => {
	figma.ui.resize(size[0],size[1])
})


function makeRow(frames: Array<SceneNode>, spacing: Spacing){
	let columns = []
	//Get the top most frame
	let topFrame = getTopFrame(frames)

	//Get the left most frame, to align from
	if(leftFrame === null){
		leftFrame = frames.reduce(function(prev,curr) {
		return prev.x < curr.x ? prev : curr
		})	
	}

	let xOffset = leftFrame.x //Where to start aligning horizontally from

	//Only get frames where more than half is above the bottom of the top frame
	//Sort them so theyre in left-right-order
	let newRow = frames.filter(frame => (frame.y + frame.height/2) <= topFrame.y + topFrame.height || frame == topFrame).sort((a,b) => a.x - b.x) as Array<SceneNode>

	newRow.forEach(async (frame,index) => {

		// `Row:${rowCount} Index:${index+1} `
		frame.y = topFrame.y
		frame.x = xOffset
		xOffset += frame.width + spacing.horizontal

		columns.push({
			id: frame.id,
			// img: await frame.exportAsync({format: "SVG"}).then((buffer) => {
			// 	return "data:image/svg+xml;base64," + Buffer.from(buffer).toString('base64');
			// }),
			width: frame.width,
			height: frame.height,
			row: rowCount,
			column: index
		})
		
	})

	//Get the tallest frame in that row
	const tallest = newRow.reduce(function(prev,curr) {
		return prev.height > curr.height ? prev : curr
	})

	layout.push(columns)

	const nextFrames = frames.filter( x => {return newRow.indexOf(x) < 0})


	if(nextFrames.length > 0 ){
		const nextTop = getTopFrame(nextFrames)
		let heightDiff = tallest.y + tallest.height - nextTop.y
		nextFrames.forEach(frame => {
			frame.y += heightDiff + spacing.vertical
		 } )
		rowCount ++		
		makeRow(nextFrames,spacing)
	} else {
		rowsDone()
	}

}

function rowsDone(){

	const firstIndex = Math.min(...layout.flat().map(n => {
		return figma.currentPage.children.findIndex(layer => layer.id == n.id)
	}))

	const nodes = layout.flat().map(n => figma.getNodeById(n.id) as SceneNode)

	const bounds = {
		x:  nodes.reduce(function(prev,curr) {
			return prev.x < curr.x ? prev : curr
			}).x,
		get x2(){let r = nodes.reduce(function(prev,curr){
			return prev.x + prev.width > curr.x + curr.width ? prev : curr
		}); return r.x + r.width },
		y:  nodes.reduce(function(prev,curr) {
			return prev.y < curr.y ? prev : curr
			}).y, 
		get y2(){let r = nodes.reduce(function(prev,curr){
				return prev.y + prev.height > curr.y + curr.height ? prev : curr
			}); return r.y + r.height },

		get height(){return this.y2 - this.y},
		get width(){return this.x2 - this.x}
	}
	dispatch('viewport',bounds)

	



	// //Sort the frames
	nodes.sort(function(a,b) {
		if(a.y === b.y){
			return b.x - a.x
		}
		return a.y < b.y ? 1 : -1;
	})
	nodes.forEach((item,index) => {
		figma.currentPage.insertChild(index+firstIndex,item)
			})


	var layoutStructured = []
	layout.forEach((row,rowIndex) => {
		let columns = []
		row.forEach((column) => {
			columns.push(column)
		})
		layoutStructured.push({
		row: rowIndex,
		columns: columns
		})
	})
	dispatch('setLayout', layoutStructured)
	figma.viewport.scrollAndZoomIntoView(nodes)
}

function getTopFrame(frames: Array<SceneNode>){
	return frames.reduce(function(prev, curr) {
		return prev.y < curr.y ? prev : curr; 
	});
}



handleEvent("organise", (spacing) => {
	layout = []
	leftFrame = null
	rowCount = 0
	const frames = figma.currentPage.selection.filter(sel => sel.type !== "SLICE") as Array<SceneNode>

	makeRow(frames, spacing)	
		  
})


handleEvent("newLayout",(data) => {

	console.log("Layout change from UI")
	
	var data = JSON.parse(data)
	let datlayout = data.layout

	datlayout = datlayout.filter(rows => rows.columns.length > 0)

	dispatch('setLayout',datlayout)
	let spacing = data.spacing
	var nodes = []
	let topFrame = figma.getNodeById(datlayout[0].columns[0].id) as SceneNode;
	var yOffset = topFrame.y

	datlayout.forEach(row => {
		console.log(row)
		const tallest = row.columns.reduce(function(prev,curr) {
			return prev.height > curr.height ? prev : curr
		})
		console.log(tallest)
		var xOffset = topFrame.x
		row.columns.forEach(column => {
			let node = figma.getNodeById(column.id) as SceneNode
			nodes.push(node)
			node.y = yOffset
			node.x = xOffset

			xOffset += node.width + spacing.horizontal
		})
		yOffset += tallest.height + spacing.vertical
})

	
	const bounds = {
		x:  nodes.reduce(function(prev,curr) {
			return prev.x < curr.x ? prev : curr
			}).x,
		get x2(){let r = nodes.reduce(function(prev,curr){
			return prev.x + prev.width > curr.x + curr.width ? prev : curr
		}); return r.x + r.width },
		y:  nodes.reduce(function(prev,curr) {
			return prev.y < curr.y ? prev : curr
			}).y, 
		get y2(){let r = nodes.reduce(function(prev,curr){
				return prev.y + prev.height > curr.y + curr.height ? prev : curr
			}); return r.y + r.height },

		get height(){return this.y2 - this.y},
		get width(){return this.x2 - this.x}
	}
	dispatch('viewport',bounds)
	figma.viewport.scrollAndZoomIntoView(nodes)

	


});

//For Development Only!
handleEvent("makeTestNodes", (count) => {
	let nodes =[]	
	for(var i = 0; i < count; i++){
		let frame = figma.createFrame()
		nodes.push(frame)
		frame.x = Math.round(Math.random() * 6000)
		frame.y = Math.round(Math.random() * 6000)
		frame.resize(360 + (Math.round(Math.random() * 1000)), 640 + (Math.round(Math.random() * 1000)))
		let shade = Math.random()
		frame.fills = [{
			type: "SOLID",
			color: {
				r: shade,
				g: shade,
				b: 1
			}
		}]
	 }
	 figma.currentPage.selection = nodes
	 figma.viewport.scrollAndZoomIntoView(nodes)
})			


handleEvent('unhighlight', (id) => {
	let node = figma.getNodeById(id)
		removeHighlight(node)
})
handleEvent('highlight', (id) => {
	let node = figma.getNodeById(id)
	figma.currentPage.selection.forEach(n => {
		removeHighlight(n)
	})
	highlight(node)
})

function highlight(frame){
	//Highlight it with a hot pink glow because I'm a sassy bitch
	frame.effects = [...frame.effects,
		{
		  "type": "DROP_SHADOW",
		  "color": {
			"r": 1,
			"g": 105/255,
			"b": 180/255,
			"a": 1
		  },
		  "offset": {
			"x": 0,
			"y": 0
		  },
		  "radius": 50,
		  "spread": 50,
		  "visible": true,
		  "blendMode": "NORMAL"
		}
	]
	frame.setPluginData('highlighted', 'true')
}

function removeHighlight(frame){

try{
	if(
		frame.getPluginData('highlighted') == 'true' &&
		frame.effects[frame.effects.length -1].type == "DROP_SHADOW" 
	  ){
		  frame.effects = [...frame.effects.slice(0,-1)]
	  }
	  frame.setPluginData('highlighted', 'false')
	 } catch(e){
		 //console.log(e)
	 }
}