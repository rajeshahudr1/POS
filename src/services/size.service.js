const { Op } = require('sequelize');
const db = require('../model');   // ✅ CORRECT
const Size = db.Size;             // ✅ ACTUAL Sequelize Model



exports.create = async (data) => {
    const exists = await Size.findOne({
        where: { size_code: data.size_code }
    });

    if (exists) {
        throw new Error('Size code already exists');
    }

    return await Size.create(data);
};

exports.update = async (id, data) => {
    const size = await Size.findByPk(id);
    if (!size) throw new Error('Size not found');

    await size.update(data);
    return size;
};

exports.remove = async (id) => {
    const size = await Size.findByPk(id);
    if (!size) throw new Error('Size not found');

    await size.destroy();
    return true;
};

exports.list = async ({ page, limit, search }) => {
    const offset = (page - 1) * limit;

    const where = search ? {
        [Op.or]: [
            { size_name: { [Op.like]: `%${search}%` } },
            { size_code: { [Op.like]: `%${search}%` } }
        ]
    } : {};

    const { rows, count } = await Size.findAndCountAll({
        where,
        limit,
        offset,
        order: [['size_id', 'ASC']]
    });

    return {
        data: rows,
        pagination: {
            total: count,
            page,
            limit,
            totalPages: Math.ceil(count / limit)
        }
    };
};
