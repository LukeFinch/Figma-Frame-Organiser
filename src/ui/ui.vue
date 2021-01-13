<template>
  <div id="ui">
    <p class="type type--pos-small-normal">
      <span v-if="tooManyParents" style="color: var(--red)">You must select frames within the same parent</span>
      <span v-else-if="selectionCount < 2">Select more than one frame to start organising</span>
      <span v-else>You have <strong>{{selectionCount}} items</strong> to organise</span>  
     </p>

    <div class="flex-row" id="inputs">
      <div class="flex-columm">
      <label class="label" for="hori">Horizontal Spacing</label>
      <div class="input input--with-icon">
        <div class="icon 	icon--distribute-horizontal-spacing"></div>
        <input id="hori"  type="number" class="input__field" v-model="spacingH" @input="organise">
      </div>
      </div>
       <div class="flex-column">
       <label class="label" for="vert">Vertical Spacing</label>
      <div class="input input--with-icon">
        <div class="icon 	icon--distribute-vertical-spacing"></div>
        <input id="vert" type="number" class="input__field" v-model="spacingV" @input="organise">
      </div>
      </div>

    </div>
    <div class="flex row-reverse">
      <button class="button button--primary" @click='organise' :disabled="selectionCount < 2 || tooManyParents"> Organise Frames </button>

    <div class="checkbox">
      <input id="sortCheck" v-model="sortOrder" type="checkbox" class="checkbox__box">
      <label for="sortCheck"  class="checkbox__label">Reverse Sort Order</label>
    </div>
  </div>
    <Disclosure heading="View Frame Mini Map" :expanded="false" :section="false">
        <div class="flex row justify-content-start">
            <button class="reset-Button icon-button mr-xxxsmall" @click="resize(-1)" :disabled="appWidth <= 400">
          <div class="icon icon--minus"></div>
        </button>
        <button class="reset-Button icon-button">
          <div class="icon icon--plus" @click="resize(1)"></div>
        </button>
  </div>
    <div id="wrap">
     

        <draggable
        class="Map" id="map"
        group="rows"
        ghost-class="ghost"
        @change="handleFrameChange"
        :empty-insert-threshold="100"
        :list="layout"
        itemKey=row.row>         
            <!-- Row -->
          <template #item={index} > 
            <div :style="{marginBottom: spacingV/20}" class="dragRowContainer">
            <draggable
            class="dragRow"
            :list="layout[index].columns" 
            itemKey=index            
            group="columns"
            ghost-class="ghost"
            @change="handleFrameChange"
            >
                  <template #item={element,index}>
                        <div class="dragColumn"
                        @mouseover="highlight(element,index,$event)"
                        @mouseout="unhighlight(element,index,$event)"
                        @dblclick="zoomTo(element,index,$event)"
                        @dragstart="drag=true"
                        @dragend="drag=false"
                        :style="{
                          width:element.width/10 +'px',
                          height:element.height/10+'px',
                          marginRight: spacingH/10,
                          borderWidth: 10/mapScale.value + 'px'
                          }">
                        
                        </div>
                  </template>
                </draggable>
                </div>       
                      
          </template>        
        </draggable>       

  </div>
  <div class="mt-medium flex row justify-content-start ">
    <button class="button button--secondary-destructive" @click="emptyRows" :disabled="!layout.some(row => row.columns.length == 0)">Clear Empty Rows</button>
    <button class="button button--primary ml-xsmall" @click="insertRow">Add Row</button>
  </div>
    </Disclosure>

    <Disclosure v-if="devMode" heading="Dev Tools" :expanded=false :section=false>
      <p>{{drag}}</p>
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

  const app = document.getElementById('app')
  app.style.width = 400;

  const randomFrameCount = ref(40)

  const appWidth = ref(400)


  const spacingH = ref(120)
  const spacingV = ref(240)
  const selectionCount = ref(0)
  const layout = ref([])
  const mapScale = ref(1)
  const sortOrder = ref(false)
  const tooManyParents = ref(false)
  var drag = ref(false)




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
      mapScale.value = scale / Math.min(elm.clientWidth / parentWidth, elm
        .clientHeight / parentHeight)
    } else {
      elm.style.transform = 'scale(' + scale / Math.max(elm.clientWidth / parentWidth, elm
        .clientHeight / parentHeight) + ')';
      mapScale.value = scale / Math.max(elm.clientWidth / parentWidth, elm
        .clientHeight / parentHeight)
    }
  }

  const devMode = BUILD_MODE == 'dev';
  console.log('devMode:', devMode)

  const helperText = computed(() => {
    let text
    if(tooManyParents.value){
      text = "<span class=red>You must select frames within the same parent</span>"
    } else {
      text = selectionCount.value > 1 ? `You have selected <strong>${selectionCount.value} items</strong>` :
        `Select more than one frame to start organising`
    }
      return text
    })

  export default {
    components: {
      // nestedDraggable,
      draggable,
      Disclosure
    },
    setup() {

      function insertRow(){
    layout.value.push({columns: []})
  }
    function emptyRows(){
      layout.value = layout.value.filter(row => row.columns.length > 0)
    }

    function resize(direction){
      const amount = 20 * direction
      appWidth.value += amount
      console.log(appWidth.value)
      app.style.width = Number(app.style.width.replace('px','')) + amount +'px'
    }

      function handleFrameChange(evt) {
        //console.log(evt)
        //stop it firing twice.
        if (evt.added || evt.moved) {
          let spreadLayout = [...layout.value]
          //console.log(spreadLayout)
          let dat = spreadLayout.map(n => {
            return {
              ...n
            }
          })
          // console.log(dat)
          let data = {
            'layout': dat,
            'spacing': {
              horizontal: Number(spacingH.value),
              vertical: Number(spacingV.value)
            }
          }
          dispatch('newLayout', JSON.stringify(data))
        }
      }



      function organise() {
        if (selectionCount.value > 1) {
          dispatch('organise', {
            sort: sortOrder.value,
            spacing: {
            horizontal: Number(spacingH.value),
            vertical: Number(spacingV.value)
            }
          })
        }
      }

      function makeTestFrames() {
        //For helping dev...
        dispatch('makeTestNodes', randomFrameCount.value)
      }

      function highlight(element, index, $event) {
        if (!drag.value) {
        $event.target.classList.add('hover')
          dispatch('highlight', element.id)
        } else {
          $event.target.classList.remove('hover')
        }
      }

      function unhighlight(element, index, $event) {
        $event.target.classList.remove('hover')
        dispatch('unhighlight', element.id)
      }

       function zoomTo(element, index, $event) {
        dispatch('zoomTo', element.id)
      }

      onMounted(() => {

        handleEvent('warnTooManyParents', (data) => {          
          tooManyParents.value = data
          console.log(tooManyParents.value)
        })

        handleEvent('spacingPrefs', (data) => {
          spacingH.value = data.horizontal
          spacingV.value = data.vertical
        })

        document.addEventListener("dragstart", function (event) {
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
          scaleBasedOnParent(map, 1, true)
        });
        resizeObserver.observe(app)

        const mapResizeObserver = new ResizeObserver((evt) => {

          scaleBasedOnParent(map, 1, true)

          document.getElementById('ghostStyle').innerText = `.ghost{transform: scale(${mapScale.value})}`
        })
        mapResizeObserver.observe(map)

        handleEvent('updateSelectionCount', (data) => {
          selectionCount.value = data
        })

        handleEvent('viewport', (data) => {
          let ratio = (data.height / data.width) * 100
          document.getElementById('wrap').style.height = ratio > 160 ? '160vw' : ratio + 'vw'
          //console.log('mapHeight', document.getElementById('map').scrollHeight)
          //document.getElementById('wrap').style.height = document.getElementById('map').scrollHeight + 'px'
        })

        handleEvent('setLayout', (data) => {

          layout.value = data
          //scaleBasedOnWindow(map,1,true)
        })

      });

      return {
        appWidth,
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
        zoomTo,
        mapScale,
        drag,
        sortOrder,
        tooManyParents,
        insertRow,
        emptyRows,
        resize
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

  #ui > * {
    margin-bottom: 8px
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
    width: 100%;
    box-sizing: content-box;
    transform-origin: top left;
    height: 100%;
  }
  .dragRow:empty{
    background: var(--purple4);
    min-height: 16vh;
  }

  .dragRowContainer{
    display: flex;
  }
  .dragRowContainer:hover{
   background: var(--selection-a)
  }

  /* .dragRowContainer::after {
    content: '';
    display: block;
    z-index: -10;
    width: 1px;
    transform: scalex(9999999);
    background: var(--black1);
  } */

  .dragRowContainer:last-child {
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
    min-width: 10%;
    min-height: 20vh;
    max-width: 70%;
      }

  .hover {
    /* box-shadow: 0 0 5px 5px hotpink; */
    border: 1px solid hotpink;
  }

  .active {
    border: 1px solid black;
  }

  .dragColumn:last-child {
    margin-right: 0px !important;
  }

  #inputs{
    margin-bottom: 16px;
  }

  #map {
    width: max-content;
    transition-property: transform;
    transition-duration: 100ms;
    transition-timing-function: ease-in-out;
    transition-delay: 50ms;
    min-height: max-content;
    transform-origin: top center;
  }

  #wrap {
    /* width: calc(100vw - (var(--size-small) * 2)); */
    width: 100%;
    min-height: 50vw;
    max-height: 150vw;
    /* margin: var(--size-xxsmall) 0 0 0; */
    box-sizing: content-box;
    /* padding: var(--size-xxsmall) var(--size-small); */
    display: flex;
    align-items: flex-start;
    justify-content: center;
  }

  .ghost {
    background: hotpink;
  }

.reset-Button {
    border: none;
    margin: 0;
    padding: 0;
    width: auto;
    overflow: visible;

    background: transparent;

    outline: none;

    text-align: inherit;

    border-radius: inherit;

    /* inherit font & color from ancestor */
    color: inherit;
    font: inherit;

    /* Normalize `line-height`. Cannot be changed from `normal` in Firefox 4+. */
    line-height: normal;

    /* Corrects font smoothing for webkit */
    -webkit-font-smoothing: inherit;
    -moz-osx-font-smoothing: inherit;

    /* Corrects inability to style clickable `input` types in iOS */
    -webkit-appearance: none;
}
.icon-button:disabled{
  opacity: 0.2;
}

</style>