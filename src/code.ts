//Types
interface Spacing {
	vertical: number,
	horizontal: number
}

var leftFrame = null
var rowCount
var layout = []


import { access } from 'fs';
import { dispatch, handleEvent } from './codeMessageHandler';
figma.showUI(__html__);
figma.ui.resize(400,400);
//Send selection length on launch
let frames = figma.currentPage.selection.filter(sel => sel.type !== "SLICE")
let parents = frames.reduce((a,b) => {
	a.add(b.parent)
	return a
}, new Set)

if(parents.size > 1){
	figma.notify('Organiser only works on items with the same parent')
	dispatch('warnTooManyParents', true)
} else {
	dispatch('warnTooManyParents', false)
}


dispatch('updateSelectionCount',frames.length)
dispatch('viewport',figma.viewport.bounds)

figma.clientStorage.getAsync('spacing').then(
	userSpacing => dispatch('spacingPrefs',userSpacing),
	failed => console.error(failed)
)
// The following shows how messages from the UI code can be handled in the main code.
figma.on("selectionchange", () => {
	const frames = figma.currentPage.selection.filter(sel => sel.type !== "SLICE")
	let parents = frames.reduce((a,b) => {
		a.add(b.parent)
		return a
	}, new Set)

	if(parents.size > 1){
		dispatch('warnTooManyParents', true)
	} else {
		dispatch('warnTooManyParents', false)
	}

	
	dispatch('updateSelectionCount',frames.length)
})

handleEvent("resizeUI", (size) => {
	figma.ui.resize(size[0],size[1])
})
handleEvent("zoomTo", (id) => {
	let node = [figma.getNodeById(id)]
	figma.viewport.scrollAndZoomIntoView(node)
	figma.viewport.zoom *= 0.8
})


function makeRow(frames: Array<SceneNode>, spacing: Spacing, reverse: Boolean){
	let columns = []
	
	//Sort by X
	frames.sort((a,b) => {
		return a.x - b.x
	}) 

	//Get the left most frame, to align from
	if(leftFrame === null){
		leftFrame = frames.reduce(function(prev,curr) {
		return prev.x < curr.x ? prev : curr
		})	
	}

	let xOffset = leftFrame.x //Where to start aligning horizontally from

	//Get the top most frame
	let topFrame = getTopFrame(frames) as SceneNode
	


	//Only get frames where more than half is above the bottom of the top frame
	//Sort them so theyre in left-right-order
	//let newRow = frames.filter(frame => (frame.y + frame.height/2) <= topFrame.y + topFrame.height).sort((a,b) => a.x - b.x) as Array<SceneNode>
	let newRow = frames.filter(frame => frame.y <= topFrame.y + topFrame.height/2).sort((a,b) => a.x - b.x) as Array<SceneNode>
	

	newRow.forEach((frame,index) => {

	
		// `Row:${rowCount} Index:${index+1} `
		frame.y = topFrame.y
		frame.x = xOffset
		xOffset += frame.width + spacing.horizontal
		if(frame.height > topFrame.height){topFrame = frame}

		columns.push({
			id: frame.id,
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
		makeRow(nextFrames,spacing, reverse)
	} else {
		rowsDone(reverse)
	}

}

function rowsDone(reverse){
	console.log('Reverse?',reverse)

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
	//dispatch('viewport',bounds)	



	// //Sort the frames
	nodes.sort(function(a,b) {
		if(a.y === b.y){
			return b.x - a.x
		}
		return a.y < b.y ? 1 : -1;
	})

	reverse ? nodes.reverse() : null

	let parent = nodes[0].parent

	nodes.forEach((item,index) => {
		parent.insertChild((firstIndex >= 0 ? firstIndex : 0) + index,item)
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
	}) as SceneNode
}



handleEvent("organise", (data) => {

	const spacing = data.spacing
	figma.clientStorage.setAsync('spacing',spacing)
	layout = []
	leftFrame = null
	rowCount = 0
	const frames = figma.currentPage.selection.filter(sel => sel.type !== "SLICE") as Array<SceneNode>

	makeRow(frames, spacing, data.sort)	
		  
})


handleEvent("newLayout",(data) => {

	console.log("Layout change from UI")
	
	var data = JSON.parse(data)
	let datlayout = data.layout

	datlayout = datlayout.filter(rows => rows.columns.length > 0)

	//dispatch('setLayout',datlayout)
	let spacing = data.spacing
	var nodes = []
	let topFrame = figma.getNodeById(datlayout[0].columns[0].id) as SceneNode;
	var yOffset = topFrame.y
	console.log(topFrame)
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
	//dispatch('viewport',bounds)
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
	let nodes = figma.currentPage.findAll(n => n.getPluginData('highlighted') === 'true')
	nodes.forEach(node => removeHighlight(node))
	//let node = figma.getNodeById(id)
		//removeHighlight(node)
})
handleEvent('highlight', (id) => {
	let node = figma.getNodeById(id)
	let nodes = figma.currentPage.findAll(n => n.getPluginData('highlighted') === 'true')
	nodes.forEach(node => removeHighlight(node))
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
		  "radius": frame.width * 0.05,
		  "spread": frame.width * 0.05,
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