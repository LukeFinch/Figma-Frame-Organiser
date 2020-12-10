var leftFrame = null
var rowCount


import { dispatch, handleEvent } from './codeMessageHandler';
figma.showUI(__html__);
//Send selection length on launch
let frames = figma.currentPage.selection.filter(sel => sel.type == "FRAME")
dispatch('updateSelectionCount',frames.length)

// The following shows how messages from the UI code can be handled in the main code.

figma.on("selectionchange", () => {
	const frames = figma.currentPage.selection.filter(sel => sel.type == "FRAME")
	dispatch('updateSelectionCount',frames.length)
})

interface Spacing {
	vertical: number,
	horizontal: number
}

function makeRow(frames: Array<FrameNode>, spacing: Spacing){
	rowCount ++
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
	let newRow = frames.filter(frame => (frame.y + frame.height/2) <= topFrame.y + topFrame.height || frame == topFrame).sort((a,b) => a.x - b.x) as Array<FrameNode>
	let shade = Math.random()
	newRow.forEach((frame,index) => {
		frame.name = `Row:${rowCount} Index:${index+1} `
		frame.y = topFrame.y
		frame.x = xOffset
		xOffset += frame.width + spacing.horizontal
		frame.fills = [{
			type: "SOLID",
			color: {
				r: shade,
				g: shade,
				b: 1
			}
		}

		]
	})

	//Get the tallest frame in that row
	const tallest = newRow.reduce(function(prev,curr) {
		return prev.height > curr.height ? prev : curr
	})


	const nextFrames = frames.filter( x => {return newRow.indexOf(x) < 0})


	if(nextFrames.length > 0 ){
		const nextTop = getTopFrame(nextFrames)
		let heightDiff = tallest.y + tallest.height - nextTop.y
		console.log(heightDiff)
		nextFrames.forEach(frame => {
			frame.y += heightDiff + spacing.vertical
		 } )		
		makeRow(nextFrames,spacing)
	} else {
		rowsDone()
	}

}

function rowsDone(){

	//This is such a bad way of sorting frames.. please figma make it easier for us...
	let sel = [ ...figma.currentPage.selection].sort(function(a,b) {
		if(a.y === b.y){
			return b.x - a.x
		}
		return a.y < b.y ? 1 : -1;
	})
	sel.forEach(item => {
		item.clone()
		item.remove()
	})
	figma.notify('All Done!')

}

function getTopFrame(frames: Array<FrameNode>){
	return frames.reduce(function(prev, curr) {
		return prev.y < curr.y ? prev : curr; 
	});
}



handleEvent("organise", (spacing) => {
	leftFrame = null
	rowCount = 0
	const frames = figma.currentPage.selection.filter(sel => sel.type == "FRAME") as Array<FrameNode>
	makeRow(frames, spacing)


	
		  
})

//For Development Only!
handleEvent("makeTestNodes", (count) => {
	let nodes =[]	
	for(var i = 0; i < count; i++){
		let frame = figma.createFrame()
		nodes.push(frame)
		frame.x = Math.round(Math.random() * 6000)
		frame.y = Math.round(Math.random() * 6000)
		frame.resize(360, 640 + (Math.round(Math.random()) * 1000))
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

function highlight(frame: FrameNode){
	//Highlight it with a hot pink glow because I'm a sassy bitch
	frame.effects = [...frame.effects,
		{
		  "type": "DROP_SHADOW",
		  "color": {
			"r": 1,
			"g": 0,
			"b": 0.7,
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

function removeHighlight(frame: FrameNode){
if(
	frame.getPluginData('highlighted') === 'true' &&
	frame.effects[frame.effects.length].type == "DROP_SHADOW" 
  ){
	  frame.effects = [...frame.effects.slice(0,-1)]
  }
}