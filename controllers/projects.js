const jsgraphs = require('js-graph-algorithms');

const Project = require('../models/project');
const Node = require('../models/node');
const Link = require('../models/link');

const getDistance = (origin, destination) => {
    // return distance in meters
    const lon1 = toRadian(origin[1]),
        lat1 = toRadian(origin[0]),
        lon2 = toRadian(destination[1]),
        lat2 = toRadian(destination[0]);

    const deltaLat = lat2 - lat1;
    const deltaLon = lon2 - lon1;

    const a = Math.pow(Math.sin(deltaLat / 2), 2) + Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin(deltaLon / 2), 2);
    const c = 2 * Math.asin(Math.sqrt(a));
    const EARTH_RADIUS = 6371;
    return c * EARTH_RADIUS * 1000;
}
const toRadian = (degree) => degree * Math.PI / 180;

const paths = (nodes, links) => {
    const linksDistances = links.map((link, i) => getDistance([link.source.position.latitude, link.source.position.longitude], [link.destination.position.latitude, link.destination.position.longitude]));
    const linksNodesIndexes = links.map((link, i) => {
        const v = nodes.findIndex(node => node._id.toString() === link.source._id.toString());
        const w = nodes.findIndex(node => node._id.toString() === link.destination._id.toString());
        return { v, w };
    });

    const g = new jsgraphs.WeightedDiGraph(nodes.length);

    links.forEach((link, i) => {
        const { v, w } = linksNodesIndexes[i];
        const weight = linksDistances[i];

        g.addEdge(new jsgraphs.Edge(v, w, weight));
        g.addEdge(new jsgraphs.Edge(w, v, weight));
    });

    nodes.forEach((node, i) => {
        g.node(i).label = node.name;
    });

    const paths = {};
    nodes.forEach((node, index) => {
        let dijkstra = new jsgraphs.Dijkstra(g, index);
        const otherNodes = nodes.filter((n, j) => j !== index);
        const nodePaths = [];

        otherNodes.forEach((oNode) => {
            const v = nodes.findIndex(node => node._id.toString() === oNode._id.toString());
            if (dijkstra.hasPathTo(v)) {
                const path = dijkstra.pathTo(v);
                const customPath = [];
                for (let i = 0; i < path.length; ++i) {
                    const e = path[i];
                    customPath.push({ from: e.from(), to: e.to(), weight: e.weight });
                }
                nodePaths.push({ to: oNode.name, path: customPath, distance: dijkstra.distanceTo(v) });
            } else {
                nodePaths.push({ to: oNode.name, path: 'No path', distance: Infinity });
            }
        });
        paths[node.name] = nodePaths;
    });
    return paths;
};

exports.getProjects = async (req, res, next) => {
    try {
        const projects = await Project.find(null, null, { sort: { name: 1 } });
        res.status(200).json({ projects });
    } catch (err) {
        const error = new Error(err);
        error.statusCode = 500;
        return next(error);
    }
};

exports.getProject = async (req, res, next) => {
    const { projectId, option, projectName, bandwidth } = req.body;

    try {
        let project = null;
        if (option === 'open') project = await Project.findById(projectId);
        else {
            project = new Project({
                name: projectName,
                bandwidth
            });
            await project.save();
        }

        res.status(200).json({ project });
    } catch (err) {
        const error = new Error(err);
        error.statusCode = 500;
        return next(error);
    }
};

exports.getNodes = async (req, res, next) => {
    const { projectId } = req.params;

    try {
        const nodes = await Node.find({ projectId });
        res.status(200).json({ nodes });
    } catch (err) {
        const error = new Error(err);
        error.statusCode = 500;
        return next(error);
    }
};

exports.postNode = async (req, res, next) => {
    const { name, latitude, longitude, _id } = req.body;
    const { projectId } = req.params;

    try {
        if (_id) {
            const node = await Node.findById(_id);
            node.name = name;
            node.position.latitude = latitude;
            node.position.longitude = longitude;
            await node.save();
        }
        else {
            const node = new Node({ name, position: { latitude, longitude }, projectId });
            await node.save();
        }
        const nodes = await Node.find({ projectId });
        const links = await Link.find({ projectId }).populate('source').populate('destination');
        const result = paths(nodes, links);
        res.status(201).json({ nodes, links, paths: result });
    } catch (err) {
        const error = new Error(err);
        error.statusCode = 500;
        return next(error);
    }
};

exports.deleteNode = async (req, res, next) => {
    const { projectId, nodeId } = req.params;

    try {
        await Node.findByIdAndDelete(nodeId);
        const nodes = await Node.find({ projectId });
        const links = await Link.find({ projectId }).populate('source').populate('destination');
        const result = paths(nodes, links);
        res.status(201).json({ nodes, links, paths: result });
    } catch (err) {
        const error = new Error(err);
        error.statusCode = 500;
        return next(error);
    }
};

exports.getLinks = async (req, res, next) => {
    const { projectId } = req.params;

    try {
        const links = await Link.find({ projectId }).populate('source').populate('destination');
        res.status(200).json({ links });
    } catch (err) {
        const error = new Error(err);
        error.statusCode = 500;
        return next(error);
    }
};

exports.postLink = async (req, res, next) => {
    const { source, destination, bandwidth, _id } = req.body;
    const { projectId } = req.params;

    try {
        const sourceNode = await Node.findOne({ projectId, _id: source });
        const destinationNode = await Node.findOne({ projectId, _id: destination });
        if (_id) {
            const link = await Link.findById(_id);
            link.source = sourceNode;
            link.destination = destinationNode;
            link.bandwidth = bandwidth;
            await link.save();
        } else {
            const link = new Link({ source: sourceNode, destination: destinationNode, bandwidth, projectId });
            await link.save();
        }
        const links = await Link.find({ projectId }).populate('source').populate('destination');
        res.status(201).json({ links });
    } catch (err) {
        const error = new Error(err);
        error.statusCode = 500;
        return next(error);
    }
};

exports.deleteLink = async (req, res, next) => {
    const { projectId, linkId } = req.params;

    try {
        await Link.findByIdAndDelete(linkId);
        const links = await Link.find({ projectId }).populate('source').populate('destination');
        res.status(201).json({ links });
    } catch (err) {
        const error = new Error(err);
        error.statusCode = 500;
        return next(error);
    }
};

exports.getShortestPaths = async (req, res, next) => {
    const { projectId } = req.params;

    try {
        const nodes = await Node.find({ projectId });
        const links = await Link.find({ projectId }).populate('source').populate('destination');

        const result = paths(nodes, links);

        res.status(200).json({ paths: result });
    } catch (err) {
        const error = new Error(err);
        error.statusCode = 500;
        return next(error);
    }
};