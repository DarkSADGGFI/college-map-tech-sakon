const walkPathGraphData = {
  waypoints: {
    main_gate: { lat: 17.19513814724714, lng: 104.0888151174978, name: "Main Gate" },
    building_6_node: { lat: 17.19447060637371, lng: 104.0884049868181, name: "Building 6 Node" },
    main_gate_node_junction: { lat: 17.19509252391537, lng: 104.0887874157878, name: "Main Gate Junction" },
    english_building_node: { lat: 17.1949959159847, lng: 104.0874386047456, name: "English Building Node" },
    library_node: { lat: 17.19562008929402, lng: 104.087815269936, name: "Library Node" },
    cafeteria_node_junction: { lat: 17.19479467416091, lng: 104.088606927519, name: "Cafeteria Junction" }
  },
  graph: {
    main_gate: ["building_6_node", "main_gate_node_junction"],
    building_6_node: ["main_gate", "english_building_node", "cafeteria_node_junction"],
    main_gate_node_junction: ["main_gate", "library_node"],
    english_building_node: ["building_6_node", "library_node"],
    library_node: ["main_gate_node_junction", "english_building_node"],
    cafeteria_node_junction: ["building_6_node"]
  },
  routeOverlay: {
    type: "FeatureCollection",
    name: "walk-way-graph",
    features: [
      {
        type: "Feature",
        properties: { Name: "Main road 1" },
        geometry: {
          type: "LineString",
          coordinates: [
            [104.0888153904702, 17.19513887790847, 0],
            [104.0884050716721, 17.19447199787477, 0]
          ]
        }
      },
      {
        type: "Feature",
        properties: { Name: "Middle road" },
        geometry: {
          type: "LineString",
          coordinates: [
            [104.088404221665, 17.19447698869899, 0],
            [104.087438192156, 17.19499450298937, 0]
          ]
        }
      },
      {
        type: "Feature",
        properties: { Name: "Walk way though a parking lot" },
        geometry: {
          type: "LineString",
          coordinates: [
            [104.0887940051386, 17.19509847277503, 0],
            [104.0878137922619, 17.19562206083662, 0]
          ]
        }
      },
      {
        type: "Feature",
        properties: { Name: "Library road" },
        geometry: {
          type: "LineString",
          coordinates: [
            [104.0878138312349, 17.19562005028439, 0],
            [104.087436253749, 17.19499486464872, 0]
          ]
        }
      }
    ]
  }
};
