export const REALM_SECONDS=75;
export const REALMS=[
 {name:'بیشهٔ نئون',sky:'#122b35',edge:'#080d18',accent:'#65e6c4',water:'#113846',tree:'#23534a',car:'#344f66',enemy:'#6df0c9'},
 {name:'درهٔ بلورها',sky:'#302044',edge:'#120d25',accent:'#dca6ff',water:'#39245d',tree:'#7956aa',car:'#66518c',enemy:'#d1a2ff'},
 {name:'کارخونهٔ خاموش',sky:'#3b2820',edge:'#160f13',accent:'#ffbc70',water:'#562e25',tree:'#826045',car:'#906049',enemy:'#ffb375'},
];
export const realmIndex=time=>Math.floor(time/REALM_SECONDS)%REALMS.length;
export const realmAge=time=>time%REALM_SECONDS;
