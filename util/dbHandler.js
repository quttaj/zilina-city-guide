const db = require("../data/database");
const { randomUUID } = require("node:crypto");


const getComments = async () => {
  const [records] = await db.query(`
      SELECT c.id, c.name, c.description, c.parent_id, c.reply_count, c.view_count, c.file_path, c.author_id, 
      CONCAT(u.first_name, ' ', u.last_name) as author
      FROM comments c
      JOIN users u ON c.author_id = u.id
      WHERE c.parent_id IS NULL`);
  return records;
};


const getRepliesForComment = async (commentId) => {
  const [records] = await db.query(`
      SELECT c.*, CONCAT(u.first_name, ' ', u.last_name) as author, u.id as user_id
      FROM comments c
      JOIN users u ON c.author_id = u.id
      WHERE c.parent_id = ?`, [commentId]);
  return records;
};

  
const createComment = async (name, description, author_id, parent_id = null, file = null) => {
    if (typeof name !== 'string' || !name.trim() || name.length > 255 ||
        typeof description !== 'string' || !description.trim() || description.length > 10000) {
      throw new Error('Invalid comment');
    }
    const id = randomUUID();
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      if (parent_id) {
        const [parents] = await connection.query('SELECT id FROM comments WHERE id = ?', [parent_id]);
        if (!parents.length) throw new Error('Parent comment not found');
      }
      let filePath = null;
      if (file) {
        const path = require('node:path');
        const extension = path.extname(file.originalname).toLowerCase().replace(/[^a-z0-9.]/g, '').slice(0, 12);
        const filename = randomUUID() + extension;
        await connection.query('INSERT INTO attachments (id, comment_id, content) VALUES (?, ?, ?)', [filename, id, file.buffer]);
        filePath = '/attachments/' + filename;
      }
      await connection.query('INSERT INTO comments (id, name, description, author_id, parent_id, file_path) VALUES (?, ?, ?, ?, ?, ?)',
        [id, name, description, author_id, parent_id || null, filePath]);
      if (parent_id) await connection.query('UPDATE comments SET reply_count = reply_count + 1 WHERE id = ?', [parent_id]);
      await connection.commit();
      return id;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally { connection.release(); }
};

const getPlaces = async () => {
  const [records] = await db.query("SELECT name, description, image_path FROM places");
  return records;
};

  
  const getPlaceByName = async (name) => {
    const [records] = await db.query("SELECT * FROM places WHERE name = ?", [name]);
    return records[0];
  };

  const getCommentsForPlace = async (placeName) => {
    const query = `
        SELECT c.*, CONCAT(u.first_name, ' ', u.last_name) as author
        FROM comments c
        JOIN users u ON c.author_id = u.id
        WHERE c.name = ? AND c.parent_id IS NULL`;
    const [records] = await db.query(query, [placeName]);
    return records;
};



const getCommentById = async (id) => {
  const [records] = await db.query(`
      SELECT c.*, u.first_name as author 
      FROM comments c
      JOIN users u ON c.author_id = u.id
      WHERE c.id = ?`, [id]);
  if (records.length > 0) {
      return records[0];
  } else {
      return null; 
  }
};

  const incrementViewCount = async (id) => {
    await db.query("UPDATE comments SET view_count = view_count + 1 WHERE id = ?", [id]);
};

function adminMiddleware(req, res, next) {
  if (req.session.isAdmin) {
      next();
  } else {
      res.status(403).send('Access Denied: You do not have permission to access this page.');
  }
}

const deleteComment = async (id) => {
  await db.query("DELETE FROM comments WHERE id = ?", [id]);
  await db.query("DELETE FROM attachments WHERE comment_id = ?", [id]);
};

const updateComment = async (id, name, description) => {
  const result = await db.query("UPDATE comments SET name = ?, description = ? WHERE id = ?", [name, description, id]);

  return result;
};





module.exports = {
  getComments,
  createComment,
  getPlaces,
  getPlaceByName,
  getCommentsForPlace,
  getRepliesForComment,
  getCommentById,
  incrementViewCount,
  adminMiddleware,
  deleteComment,
  updateComment
};
