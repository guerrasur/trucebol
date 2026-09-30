import {validSave} from './engine.js';
const KEY='trucebol-demo-v1';
// Swap this adapter for Firebase transactions later; the rules do not depend on a backend.
export const storage={load(){try{const s=JSON.parse(localStorage.getItem(KEY));return validSave(s)?s:null;}catch{return null;}},save(s){try{localStorage.setItem(KEY,JSON.stringify(s));return true;}catch{return false;}},clear(){localStorage.removeItem(KEY);}};
