import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from "../config/mysql"

// Definición de los atributos del usuario
interface DiagramaAttributes {
    ID: number;
    Tipo: string;
}

// Atributos opcionales para la creación de un usuario
interface DiagramaCreationAttributes extends Optional<DiagramaAttributes, 'ID'> {}

// Definición de la clase de modelo
class Diagrama extends Model<DiagramaAttributes, DiagramaCreationAttributes> implements DiagramaAttributes {
    public ID!: number;
    public Tipo!:string;
}

// Inicialización del modelo
Diagrama.init({
    ID: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    Tipo: {
        type: DataTypes.STRING,
        allowNull:false
    },
}, {
    sequelize,
    tableName: 'Diagrama',
    timestamps: false, 
});

export { Diagrama, DiagramaAttributes };
