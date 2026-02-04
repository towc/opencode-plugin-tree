// Messy code that needs refactoring
var data=[{n:"Alice",a:25,c:"NYC"},{n:"Bob",a:30,c:"LA"},{n:"Charlie",a:35,c:"NYC"},{n:"Diana",a:28,c:"LA"}]

function f1(x){return x.filter(function(i){return i.c==="NYC"})}
function f2(x){var s=0;for(var i=0;i<x.length;i++){s+=x[i].a}return s}
function f3(x){return x.map(function(i){return i.n})}

var r1=f1(data)
var r2=f2(r1)
var r3=f3(r1)

console.log("Names:",r3)
console.log("Total age:",r2)
console.log("Average:",r2/r3.length)
