import path from 'path';
import os from 'os';

// 获取项目根目录 (假设我们在 dist/core 或 src/core 运行)
const ROOT_DIR = path.resolve(__dirname, '../../');
const HOME_DIR = os.homedir();

// 数据库路径
// 生产环境可能放在 ~/.anyaitoken/db.sqlite
// 开发环境放在项目根目录 db/data.sqlite
export const DB_PATH = process.env.NODE_ENV === 'production' 
  ? path.join(HOME_DIR, '.anyaitoken', 'db.sqlite')
  : path.join(ROOT_DIR, 'db', 'data.sqlite');

export const ensureDbDir = () => {
    // 确保数据库目录存在
    // (逻辑在 db 初始化时处理)
};
