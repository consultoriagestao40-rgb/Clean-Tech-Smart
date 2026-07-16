import pg8000.dbapi
import ssl
import hashlib

def sha256(text):
    return hashlib.sha256(text.encode('utf-8')).hexdigest()

def main():
    print("Conectando ao banco de dados...")
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE

    conn = pg8000.dbapi.connect(
        user="neondb_owner",
        password="npg_DtfA7VXHw8ym",
        host="ep-winter-cloud-apstwhit-pooler.c-7.us-east-1.aws.neon.tech",
        database="neondb",
        port=5432,
        ssl_context=ssl_context
    )
    
    cursor = conn.cursor()
    try:
        print("Criando tabela users...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(150) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(30) DEFAULT 'vendedor',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        print("Criando tabela leads...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS leads (
                phone VARCHAR(50) PRIMARY KEY,
                name VARCHAR(150),
                stage VARCHAR(50) DEFAULT 'novo',
                value DECIMAL(10,2) DEFAULT 0.00,
                assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
                next_contact_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        print("Criando tabela crm_notes...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS crm_notes (
                id SERIAL PRIMARY KEY,
                lead_phone VARCHAR(50) REFERENCES leads(phone) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        print("Criando tabela crm_tasks...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS crm_tasks (
                id SERIAL PRIMARY KEY,
                lead_phone VARCHAR(50) REFERENCES leads(phone) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                completed BOOLEAN DEFAULT FALSE,
                due_date TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        print("Inserindo usuários padrão...")
        gestor_hash = sha256('gestor123')
        vendedor_hash = sha256('vendedor123')

        # Check and insert gestor
        cursor.execute("SELECT id FROM users WHERE email = 'gestor@cleantech.com'")
        if not cursor.fetchone():
            cursor.execute("""
                INSERT INTO users (name, email, password_hash, role)
                VALUES ('Cristiano Gestor', 'gestor@cleantech.com', %s, 'gestor')
            """, (gestor_hash,))
            
        # Check and insert vendedor
        cursor.execute("SELECT id FROM users WHERE email = 'vendedor@cleantech.com'")
        if not cursor.fetchone():
            cursor.execute("""
                INSERT INTO users (name, email, password_hash, role)
                VALUES ('Carlos Vendedor', 'vendedor@cleantech.com', %s, 'vendedor')
            """, (vendedor_hash,))

        conn.commit()
        print("Banco de dados do CRM inicializado com sucesso!")
            
    except Exception as e:
        print("Erro:", e)
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    main()
