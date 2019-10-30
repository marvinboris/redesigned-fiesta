const { Router } = require('express');

const { getProject, getProjects, getNodes, getLinks, postLink, postNode, deleteLink, deleteNode, getShortestPaths } = require('../controllers/projects');

const router = Router();

router.get('/', getProjects);
router.post('/', getProject);

router.get('/:projectId/nodes', getNodes);
router.post('/:projectId/nodes', postNode);
router.delete('/:projectId/nodes/:nodeId', deleteNode);

router.get('/:projectId/links', getLinks);
router.post('/:projectId/links', postLink);
router.delete('/:projectId/links/:linkId', deleteLink);

router.get('/:projectId/paths', getShortestPaths);

module.exports = router;