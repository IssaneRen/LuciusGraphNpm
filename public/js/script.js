const   svg = d3.select("svg"),
        width = +svg.attr("width"),
        height = +svg.attr("height");

const tooltip = d3.select("#tooltip");

// 定义箭头标记
// svg.append("defs").append("marker")
//     .attr("id", "arrow")
//     .attr("viewBox", "0 -5 10 10")
//     .attr("refX", 15)  // 控制箭头离节点的距离
//     .attr("refY", 0)
//     .attr("markerWidth", 6)
//     .attr("markerHeight", 6)
//     .attr("orient", "auto")
//     .append("path")
//     .attr("d", "M0,-5L10,0L0,5")
//     .attr("fill", "#f00");  // 将箭头颜色设置为红色

// 模组与图表的映射关系
const moduleMaps = {
    "module1": {
        "人物图": "characters.json",
        "地点图": "locations.json",
        "线索图": "clues.json"
    },
    "module2": {
        "人物图": "characters.json",
        "地点图": "locations.json",
        "线索图": "clues.json"
    }
};

// 当选择模组时更新图表选择器
d3.select("#module").on("change", function() {
    const selectedModule = d3.select(this).property("value");
    const mapSelect = d3.select("#map");
    mapSelect.selectAll("option").remove();
    mapSelect.append("option").attr("value", "").text("选择图表");

    if (selectedModule) {
        const maps = moduleMaps[selectedModule];
        for (const [key, value] of Object.entries(maps)) {
            mapSelect.append("option").attr("value", `${selectedModule}/${value}`).text(key);
        }
    }
});

// 当选择图表时加载相应的 JSON 数据
d3.select("#map").on("change", function() {
    const selectedMap = d3.select(this).property("value");
    if (selectedMap) {
        loadGraph("data/" + selectedMap);
    }
});

function loadGraph(dataFile) {
    console.info("dataFile=" + dataFile)
    // 清除现有的图形
    svg.selectAll("*").remove();
    // 重新定义箭头（由于清除 svg 内容后需要重新添加）
    svg.append("defs").append("marker")
        .attr("id", "arrow")
        .attr("viewBox", "0 -5 10 10")  // 根据路径调整 viewBox
        .attr("refX", 26)  // 根据节点大小调整 refX 节点半径20 + 箭头一半6
        .attr("refY", 0)
        .attr("markerWidth", 12)  // 设置合理的箭头大小
        .attr("markerHeight", 12)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")  // 路径与 viewBox 匹配
        .attr("fill", "#f00");  // 确保填充颜色为红色

    // svg.append("defs").append("marker")
    //     .attr("id", "arrow")
    //     .attr("viewBox", "0 -5 10 10")
    //     .attr("refX", 35)
    //     .attr("refY", 0)
    //     .attr("markerWidth", 100)
    //     .attr("markerHeight", 100)
    //     .attr("orient", "auto")
    //     .append("path")
    //     .attr("d", "M0,-5L10,0L0,5")
    //     .attr("fill", "#999");

    d3.json(dataFile).then(function(graph) {
        const nodes = graph.nodes;
        const links = graph.links;

        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).id(d => d.id).distance(100))
            .force("charge", d3.forceManyBody().strength(-300))
            .force("center", d3.forceCenter(width / 2, height / 2));

        // 绘制连线
        const link = svg.append("g")
            .attr("class", "links")
            .selectAll("line")
            .data(links)
            .enter().append("line")
            .attr("class", "link")
            .attr("marker-end", "url(#arrow)");  // 添加箭头

        // 绘制连线上的文字
        const linkText = svg.append("g")
            .attr("class", "link-text")
            .selectAll("text")
            .data(links)
            .enter().append("text")
            .attr("dy", -5)  // 调整文字的垂直位置
            .attr("text-anchor", "middle")  // 使文字居中
            .text(d => d.relationship || "");  // 使用关系说明

        const node = svg.append("g")
            .attr("class", "nodes")
            .selectAll("g")
            .data(nodes)
            .enter().append("g");

        node.append("circle")
            .attr("class", "node")
            .attr("r", 20)
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));

        node.append("text")
            .attr("dx", -15)
            .attr("dy", 5)
            .text(d => d.id);

        node.on("click", function(event, d) {
            const [x, y] = d3.pointer(event);
            tooltip
                .style("left", `${x + 20}px`)
                .style("top", `${y - 20}px`)
                .style("opacity", 1)
                .html(`<strong>${d.id}</strong><br>${d.description}`);
        });

        svg.on("click", function(event) {
            if (event.target.tagName !== 'circle') {
                tooltip.style("opacity", 0);
            }
        });

        simulation
            .nodes(nodes)
            .on("tick", ticked);

        simulation.force("link")
            .links(links);

        function ticked() {
            link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            linkText
                .attr("x", d => (d.source.x + d.target.x) / 2)  // 文字放在连线中间
                .attr("y", d => (d.source.y + d.target.y) / 2);

            node.selectAll("circle")
                .attr("cx", d => d.x)
                .attr("cy", d => d.y);

            node.selectAll("text")
                .attr("x", d => d.x)
                .attr("y", d => d.y);
        }

        function dragstarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }

        function dragended(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }
    });
}