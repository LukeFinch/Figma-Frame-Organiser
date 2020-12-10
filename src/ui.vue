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
  
        <div v-if="devMode"  class="flex-row">
                <div class="input input--with-icon">
                  <div class="icon 	icon--random"></div>
                  <input type="input" class="input__field" v-model="randomFrameCount">
                </div>
                <button class="button button--secondary" @click='makeTestFrames'> Make Test Frames </button>
          </div>
</div>
</template>

<script>
import styles from 'figma-plugin-ds/dist/figma-plugin-ds.css'
import { dispatch, handleEvent } from "./uiMessageHandler";
import {ref, onMounted, computed} from "vue"

const randomFrameCount = ref(40)

const spacingH = ref(120)
const spacingV = ref(240)
const selectionCount = ref(0)


const devMode = BUILD_MODE == 'dev';
console.log('devMode:', devMode )

const helperText = computed(() => {
  return selectionCount.value > 1 ? `You have ${selectionCount.value} frames selected to organise` : `Select more than one frame to start organising`
})

export default {
  setup(){

    function organise() {

      if(selectionCount.value > 1) {dispatch('organise',{horizontal:Number(spacingH.value),vertical:Number(spacingV.value)})}
    }
    function makeTestFrames(){
      //For helping dev...
      console.log('called make test frames')
      dispatch('makeTestNodes',randomFrameCount.value)
    }

  onMounted(() => {
      handleEvent('updateSelectionCount', (data) => {
        selectionCount.value = data
      })
    });

    return{
      spacingH,
      spacingV,
      selectionCount,
      helperText,
      randomFrameCount,
      organise,
      makeTestFrames,
      devMode
    }
  }
}
</script>

<style scoped>
#ui{
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-around;
  padding: var(--size-medium);
  height: 100vh;

}

.flex-row{
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}
</style>