<template>
  <div id="ui">
    <p class="type type--pos-small-normal">{{helperText}}</p>

    <div class="flex-row">
      <div class="input input--with-icon">
        <div class="icon 	icon--distribute-horizontal-spacing"></div>
        <input type="number" class="input__field" v-model="spacingH" @input="organise">
      </div>
      <!-- Input with icon -->
      <div class="input input--with-icon">
        <div class="icon 	icon--distribute-vertical-spacing"></div>
        <input type="number" class="input__field" v-model="spacingV" @input="organise">
      </div>
      <button class="button button--primary" @click='organise' :disabled="!selectionCount"> Organise </button>
    </div>
  <!-- <Disclosure heading="MiniMap" :expanded="false" :section="false"> -->

    <div id="wrap">
    <div class=Map id="map">
      <div
      class="dragRowContainer"
      :style="{
        marginBottom: spacingV/20,
        width: 'fit-content'
        }" v-for="(row) in layout" :key=row.row
        >

      <draggable
      class="dragRow"
      :list="row.columns"
      group="frames"
      ghost-class="ghost"
      @change="handleFrameChange"
      @start="hideGhost($event)"
      itemKey="{{row.column.id}}">
      <template #item="{element, index}">
          <div class="dragColumn"
          @mouseover="highlight(element,index,$event)"
          @mouseout="unhighlight(element,index,$event)"
          :style="{
            width:element.width/20 +'px',
            height:element.height/20+'px',
            marginRight: spacingH/20
            }">          
          </div>
        </template>
      </draggable>
      </div>
    </div>
    </div>
    <!-- </Disclosure> -->

    <Disclosure v-if="devMode" heading="Dev Tools" :expanded=false :section=false>
      <div class="flex-row">
        <div class="input input--with-icon">
          <div class="icon 	icon--random"></div>
          <input type="input" class="input__field" v-model="randomFrameCount">
        </div>
        <button class="button button--secondary" @click='makeTestFrames'> Make Test Frames </button>
      </div>
    </Disclosure>

  </div>
</template>

<script>
  import styles from 'figma-plugin-ds/dist/figma-plugin-ds.css'
  import {
    dispatch,
    handleEvent
  } from "./uiMessageHandler";
  import {
    ref,
    onMounted,
    computed,
    nextTick
  } from "vue"

  import draggable from 'vuedraggable'

  import Disclosure from './components/disclosure.vue'


  const randomFrameCount = ref(40)

  const spacingH = ref(120)
  const spacingV = ref(240)
  const selectionCount = ref(0)
  const layout = ref([])
  const mapScale = ref(1)

  const app = document.getElementById('app')

     function scaleBasedOnParent(elm, scale = 1, fit) {

      const parent = elm.parentNode
      const cs = getComputedStyle(parent)

      const paddingX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
      const paddingY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);

      const borderX = parseFloat(cs.borderLeftWidth) + parseFloat(cs.borderRightWidth);
      const borderY = parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth);
      
      const parentWidth = parent.offsetWidth - paddingX - borderX;
      const parentHeight = parent.offsetHeight - paddingY - borderY;


          if (!fit) {
            elm.style.transform = 'scale(' + scale / Math.min(elm.clientWidth / parentWidth, elm
              .clientHeight / parentHeight) + ')';
            mapScale.value = scale / Math.min(elm.clientWidth /parentWidth, elm
              .clientHeight /parentHeight)
          } else {
            elm.style.transform = 'scale(' + scale / Math.max(elm.clientWidth /parentWidth, elm
              .clientHeight /parentHeight) + ')';
              mapScale.value = scale / Math.max(elm.clientWidth /parentWidth, elm
              .clientHeight /parentHeight)
             }
        }

  const devMode = BUILD_MODE == 'dev';
  console.log('devMode:', devMode)

  const helperText = computed(() => {
    return selectionCount.value > 1 ? `You have ${selectionCount.value} frames selected to organise` :
      `Select more than one frame to start organising`
  })

  export default {
    components: {
      // nestedDraggable,
      draggable,
      Disclosure
    },
    setup() {

      function handleFrameChange(evt) 
      {
        //console.log(evt)
        //stop it firing twice.
        if(evt.added || evt.moved){
          let spreadLayout = [...layout.value]
          //console.log(spreadLayout)
          let dat = spreadLayout.map(n => {return {...n}} )
          // console.log(dat)
        let data =  {
        'layout': dat,
        'spacing':{
            horizontal: Number(spacingH.value),
            vertical: Number(spacingV.value)
          }
        }
          dispatch('newLayout', JSON.stringify(data))
        }
      }

      function hideGhost(el) {
        //console.log('hideGhost',el)
      }

      function organise() {
        if (selectionCount.value > 1) {
          dispatch('organise', {
            horizontal: Number(spacingH.value),
            vertical: Number(spacingV.value)
          })
        }
      }

      function makeTestFrames() {
        //For helping dev...
        dispatch('makeTestNodes', randomFrameCount.value)
      }

      function highlight(element,index,$event){
        dispatch('highlight',element.id)
      }
      function unhighlight(element,index,$event){
       dispatch('unhighlight',element.id)
      }

      onMounted(() => {

        document.addEventListener("dragstart", function( event ) {
    var img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
    event.dataTransfer.setDragImage(img, 0, 0);
}, false);

      const map = document.getElementById('map')
        window.onresize = () => {
          //scaleBasedOnWindow(map,1,true)
        }

        const resizeObserver = new ResizeObserver(function () {
          dispatch('resizeUI', [app.scrollWidth, app.scrollHeight])
        });
        resizeObserver.observe(app)

        const mapResizeObserver = new ResizeObserver((evt) => {

           scaleBasedOnParent(map,1,true)

          document.getElementById('ghostStyle').innerText = `.ghost{transform: scale(${mapScale.value})}`
        })
        mapResizeObserver.observe(map)
   
        handleEvent('updateSelectionCount', (data) => {
          selectionCount.value = data
        })

        handleEvent('viewport', (data) => {
          let ratio = (data.height / data.width) * 100
          document.getElementById('wrap').style.height = ratio > 160 ? '160vw' : ratio+'vw'
          console.log('mapHeight', document.getElementById('map').scrollHeight)
          //document.getElementById('wrap').style.height = document.getElementById('map').scrollHeight + 'px'
        })

        handleEvent('setLayout', (data) => {

          layout.value = data
          //scaleBasedOnWindow(map,1,true)
        })

      });

      return {
        spacingH,
        spacingV,
        selectionCount,
        helperText,
        randomFrameCount,
        organise,
        makeTestFrames,
        devMode,
        layout,
        handleFrameChange,
        highlight,
        unhighlight,
        hideGhost,
        mapScale
      }
    }
  }
</script>

<style scoped>
  #ui {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-around;
    padding: var(--size-xxsmall) var(--size-small);
    overflow: hidden;
  }

  .flex-row {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
  }

  .dragRow {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    min-height: 8px;
    width: 100%;
    box-sizing: content-box;
    transform-origin: top left;
  }
  .dragRow::after{
    content: '';
    display: block;
    z-index: -10;
    width: 1px;
    transform: scalex(9999999);
    background: var(--black1);
  }
  .dragRowContainer:last-child{
    margin-bottom: 0 !important;
  }

  .dragColumn {
    display: flex;
    background: white;
    border: 1px solid black;
    box-sizing: border-box;
    float: left;
    justify-content: center;
    align-items: center;
    font-size: 10px;
  }
  .dragColumn:hover{
    box-shadow: 0 0 5px 5px hotpink;
    border: 1px solid hotpink;
  }
  .dragColumn:last-child{
    margin-right: 0px !important;
  }

  #map{
    width: max-content;
    transition-property: transform;
    transition-duration: 100ms;
    transition-timing-function: ease-in-out;
    transition-delay: 50ms;
  }

  #wrap{
    width: calc(100vw - (var(--size-small) * 2));
    margin: 0;
    box-sizing: content-box;
    padding: var(--size-small);
    background: var(--silver);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .ghost {
    background: hotpink;
  }
</style>