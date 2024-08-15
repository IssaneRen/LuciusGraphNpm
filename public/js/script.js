const svg = d3.select("svg"),
              width = +svg.attr("width"),
              height = +svg.attr("height");

        const tooltip = d3.select("#tooltip");

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

            d3.json(dataFile).then(function(graph) {
                const nodes = graph.nodes;
                const links = graph.links;

                const simulation = d3.forceSimulation(nodes)
                    .force("link", d3.forceLink(links).id(d => d.id).distance(100))
                    .force("charge", d3.forceManyBody().strength(-300))
                    .force("center", d3.forceCenter(width / 2, height / 2));

                const link = svg.append("g")
                    .attr("class", "links")
                    .selectAll("line")
                    .data(links)
                    .enter().append("line")
                    .attr("class", "link");

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