
// Width of SVG
width = 500
// Height of SVG
height = 700

margin = ({
  top: 50,
  right: 50,
  bottom: 50,
  left: 100
})

var container = d3.create('svg')
  .attr('width', width + margin.left + margin.right)
  .attr('height', height + margin.top + margin.bottom)
  .attr('fill', 'green')

container.insert('rect', ':first-child')
  .attr('width', '100%')
  .attr('height', '100%')
  .attr('fill', '#ff96ca');

var chart = container.append('g')
  .attr('id', 'chart')
  .attr('transform', `translate(${margin.left}, ${margin.top})`)  
  .attr('fill', 'green')

chart.append('rect')
  .attr('width', width)
  .attr('height', height)
  .attr('fill', '#42adf4');

d3.select("body")
  .append(() => container.node());


