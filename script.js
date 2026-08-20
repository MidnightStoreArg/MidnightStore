// =========================================
// MIDNIGHTSTORE - LÓGICA PRINCIPAL (JAVASCRIPT)
// =========================================

// CONFIGURACIÓN DE CUPONES
const cuponesValidos = {
    "MIDNIGHT10": 0.10, 
    "FANS15": 0.15,
    "TINI20": 0.20,
    "CATRIELYPACO": 0.10
};
let descuentoActual = 0;
let nombreCupon = "";

// URL DE GOOGLE APPS SCRIPT
const urlScript = "https://script.google.com/macros/s/AKfycbycTTsTmla41I9L_AauUs-U0vGow6MWcIXR4AaxEtc3xkSNFhkoPBP-2uUGX4jwxJOb/exec";

document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('intro-overlay');
    const tienda = document.getElementById('tienda-container');
    const body = document.body;
    
    if (overlay) {
        overlay.addEventListener('click', () => {
            overlay.classList.add('vortex-anim');
            setTimeout(() => { 
                tienda.style.display = 'block'; 
                requestAnimationFrame(() => tienda.style.opacity = '1'); 
            }, 800);
            setTimeout(() => { 
                overlay.style.display = 'none'; 
                body.classList.remove('locked'); 
            }, 1500);
        });
    }

    // --- Lógica de 10% OFF visual en las Cards ---
    document.querySelectorAll('.producto-card').forEach(card => {
        const precioEl = card.querySelector('.precio');
        if (!precioEl) return;
        
        let precioOriginal = parseInt(card.dataset.precio.toString().replace(/\D/g, ''));
        
        if (!isNaN(precioOriginal)) {
            let precioDescuento = precioOriginal * 0.90; 
            
            precioEl.innerHTML = `
                <div class="precio-container">
                    <span class="precio-original">$${precioOriginal.toLocaleString('es-AR')}</span>
                    <div class="precio-descuento-fila">
                        <span class="precio-descuento">$${precioDescuento.toLocaleString('es-AR')}</span>
                        <span class="etiqueta-off">10% OFF</span>
                    </div>
                </div>
                <p class="aclaracion-pago">en efvo. o transf.</p>
            `;
        }
    });
});

let productoActual = null;
let linkMPActual = "";

function abrirProducto(card) {
    const d = card.dataset;
    
    // Limpiamos caracteres por las dudas y calculamos el descuento
    let precioLimpio = parseInt(d.precio.toString().replace(/\D/g, ''));
    let precioDescuento = precioLimpio * 0.90;

    productoActual = { nombre: d.nombre, precio: precioLimpio };
    linkMPActual = d.linkmp;

    document.getElementById('modal-titulo').innerText = d.nombre;
    document.getElementById('modal-precio').innerHTML = `
        <div class="precio-container">
            <span class="precio-original">$${precioLimpio.toLocaleString('es-AR')}</span>
            <div class="precio-descuento-fila">
                <span class="precio-descuento">$${precioDescuento.toLocaleString('es-AR')}</span>
                <span class="etiqueta-off">10% OFF</span>
            </div>
        </div>
        <p class="aclaracion-pago" style="margin-bottom: 5px;">en efectivo o transferencia</p>
    `;
    document.getElementById('modal-desc').innerText = d.desc;
    
    const imgs = d.img.split(',');
    const mainImg = document.getElementById('modal-img-main');
    const mini = document.getElementById('modal-miniaturas-container');
    mainImg.src = imgs[0].trim();
    mini.innerHTML = '';
    if(imgs.length > 1) {
        imgs.forEach((img, i) => {
            mini.innerHTML += `<img src="${img.trim()}" class="${i===0?'activa':''}" onclick="cambiarImagenPrincipal(this, this.src)">`;
        });
    }

    const contT = document.getElementById('contenedor-talles');
    if (d.talles) {
        document.getElementById('modal-select-talle').innerHTML = d.talles.split(',').map(t => `<option value="${t.trim()}">${t.trim()}</option>`).join('');
        contT.style.display = 'block';
    } else { 
        contT.style.display = 'none'; 
    }

    const contC = document.getElementById('contenedor-colores');
    if (d.colores) {
        document.getElementById('modal-select-color').innerHTML = d.colores.split(',').map(c => `<option value="${c.trim()}">${c.trim()}</option>`).join('');
        contC.style.display = 'block';
    } else { 
        contC.style.display = 'none'; 
    }

    document.getElementById('btn-mp-directo').style.display = linkMPActual ? 'block' : 'none';
    document.getElementById('modal-producto').style.display = 'flex';
}

function cambiarImagenPrincipal(el, src) {
    document.getElementById('modal-img-main').src = src;
    document.querySelectorAll('.modal-miniaturas img').forEach(i => i.classList.remove('activa'));
    el.classList.add('activa');
}

function cerrarModal() { 
    document.getElementById('modal-producto').style.display = 'none'; 
}

let carrito = [];
function toggleCarrito() { 
    document.getElementById('carrito-sidebar').classList.toggle('abierto'); 
}

const btnModalAgregar = document.getElementById('btn-modal-agregar');
if (btnModalAgregar) {
    btnModalAgregar.addEventListener('click', () => {
        let name = productoActual.nombre;
        const talle = document.getElementById('modal-select-talle').value;
        const color = document.getElementById('modal-select-color').value;
        if (document.getElementById('contenedor-talles').style.display !== 'none') name += ` (Talle: ${talle})`;
        if (document.getElementById('contenedor-colores').style.display !== 'none') name += ` (Color: ${color})`;

        const idx = carrito.findIndex(i => i.nombre === name);
        if (idx > -1) {
            carrito[idx].cantidad++;
        } else {
            carrito.push({ nombre: name, precio: productoActual.precio, cantidad: 1 });
        }
        
        actualizarCarrito(); 
        cerrarModal(); 
        toggleCarrito();
    });
}

function aplicarCupon() {
    const input = document.getElementById('input-cupon').value.trim().toUpperCase();
    const mensaje = document.getElementById('mensaje-cupon');
    if (cuponesValidos[input]) {
        descuentoActual = cuponesValidos[input];
        nombreCupon = input;
        mensaje.innerText = `✅ Cupón ${input} aplicado (-${descuentoActual * 100}%)`;
        mensaje.style.color = "#25D366";
    } else {
        descuentoActual = 0; 
        nombreCupon = "";
        mensaje.innerText = "❌ Cupón inválido";
        mensaje.style.color = "#ff4444";
    }
    actualizarCarrito();
}

function actualizarCarrito() {
    const container = document.getElementById('carrito-items');
    const btnMP = document.getElementById('btn-mp-directo');
    container.innerHTML = ''; 
    let subtotal = 0; 
    let count = 0;
    
    carrito.forEach((item, i) => {
        subtotal += item.precio * item.cantidad; 
        count += item.cantidad;
        container.innerHTML += `<div class="cart-item"><div><b>${item.cantidad}x ${item.nombre}</b><br>$${(item.precio*item.cantidad).toLocaleString('es-AR')}</div><button style="background:none; border:none; color:#ff4444; cursor:pointer;" onclick="removerItem(${i})"><i class="fas fa-trash"></i></button></div>`;
    });

    // Siempre aplicamos el 10% por transferencia/efectivo
    let descuentoPorTransferencia = subtotal * 0.10;
    // Si hay un cupón extra, lo calculamos también
    let montoDescuentoCupon = subtotal * descuentoActual; 
    
    // Total a cobrar
    let totalFinal = subtotal - descuentoPorTransferencia - montoDescuentoCupon;

    if (subtotal > 0) {
        let textoDescuentos = "10% OFF Efectivo/Transf.";
        if (descuentoActual > 0) textoDescuentos += ` + Cupón`;
        
        document.getElementById('total-precio').innerHTML = `
            <del style="color:#888; font-size:0.9rem;">$${subtotal.toLocaleString('es-AR')}</del> 
            $${totalFinal.toLocaleString('es-AR')} <span style="font-size:0.8rem; color:#FFD700; display:block;">(${textoDescuentos})</span>
        `;
        if(btnMP) btnMP.style.display = 'none'; 
    } else {
        document.getElementById('total-precio').innerText = "0";
        if(btnMP && linkMPActual) btnMP.style.display = 'block';
    }
    document.getElementById('cart-count').innerText = count;
}

async function enviarPedido() {
    if (carrito.length === 0) return;
    const nombreCliente = document.getElementById('cliente-nombre').value.trim();
    const telefonoCliente = document.getElementById('cliente-telefono').value.trim();

    if (!nombreCliente || !telefonoCliente) {
        alert("⚠️ Completá tu nombre y teléfono para finalizar.");
        return;
    }

    let msg = `Hola MIDNIGHTSTORE! 🌙%0ASoy *${nombreCliente}* (Tel: ${telefonoCliente}).%0A%0APedido:%0A`;
    let msgEmail = `Nuevo pedido de: ${nombreCliente}\nTeléfono: ${telefonoCliente}\n\n`;
    let subtotal = 0;
    let resumenExcel = "";
    
    carrito.forEach(i => {
        msg += `- ${i.cantidad}x ${i.nombre} ($${(i.precio*i.cantidad).toLocaleString('es-AR')})%0A`;
        msgEmail += `- ${i.cantidad}x ${i.nombre} ($${(i.precio*i.cantidad).toLocaleString('es-AR')})\n`;
        resumenExcel += `${i.cantidad}x ${i.nombre} | `;
        subtotal += i.precio * i.cantidad;
    });

    // Matemáticas de los descuentos
    let descuentoPorTransferencia = subtotal * 0.10;
    let montoDescCupon = subtotal * descuentoActual;
    let totalFinal = subtotal - descuentoPorTransferencia - montoDescCupon;
    
    msg += `%0A💵 Subtotal: $${subtotal.toLocaleString('es-AR')}`;
    msg += `%0A💸 Descuento Transf/Efectivo (10%): -$${descuentoPorTransferencia.toLocaleString('es-AR')}`;
    msgEmail += `\nSubtotal: $${subtotal.toLocaleString('es-AR')}`;
    msgEmail += `\nDescuento Transf/Efvo: -$${descuentoPorTransferencia.toLocaleString('es-AR')}`;
    
    if (descuentoActual > 0) {
        msg += `%0A🎁 Cupón: *${nombreCupon}* (-$${montoDescCupon.toLocaleString('es-AR')})`;
        msgEmail += `\nCupón ${nombreCupon}: -$${montoDescCupon.toLocaleString('es-AR')}`;
        resumenExcel += ` (Cupón: ${nombreCupon})`;
    }
    
    msg += `%0A%0A*Total a Pagar: $${totalFinal.toLocaleString('es-AR')}*`;
    msgEmail += `\nTotal Final: $${totalFinal.toLocaleString('es-AR')}`;
    
    msg += `%0A%0A📍 Ciudad/CP: _______`;

    // Manda el correo por EmailJS
    if (typeof emailjs !== 'undefined') {
        emailjs.send("service_e7zzb5c", "template_do28vwc", { detalle_pedido: msgEmail });
    }

    // Manda los datos al Excel en segundo plano
    fetch(urlScript, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({
            nombre: nombreCliente, 
            telefono: telefonoCliente,
            pedido: resumenExcel, 
            total: totalFinal, 
            linkMP: "WhatsApp / Transferencia" 
        })
    }).catch(e => console.log("Error al enviar a Excel", e));

    // Abre el WhatsApp
    window.open(`https://wa.me/3412274035?text=${msg}`, '_blank');
}

const btnMPDirecto = document.getElementById('btn-mp-directo');
if (btnMPDirecto) {
    btnMPDirecto.addEventListener('click', async () => {
        const nombreCliente = document.getElementById('cliente-nombre').value.trim();
        const telefonoCliente = document.getElementById('cliente-telefono').value.trim();

        if (!nombreCliente || !telefonoCliente) {
            alert("⚠️ Abrí el carrito y completá tu nombre y teléfono para pagar.");
            return;
        }

        const btnMP = document.getElementById('btn-mp-directo');
        const originalText = btnMP.innerHTML;
        btnMP.innerHTML = "<i class='fas fa-spinner fa-spin'></i> Cargando...";
        btnMP.disabled = true;

        let detalle = `${productoActual.nombre}`;
        if (document.getElementById('contenedor-talles').style.display !== 'none') {
            detalle += ` (${document.getElementById('modal-select-talle').value})`;
        }

        try {
            await fetch(urlScript, {
                method: 'POST',
                mode: 'no-cors',
                body: JSON.stringify({
                    nombre: nombreCliente, 
                    telefono: telefonoCliente,
                    pedido: detalle, 
                    total: productoActual.precio, 
                    linkMP: linkMPActual
                })
            });
            window.open(linkMPActual, '_blank');
        } catch (e) {
            window.open(linkMPActual, '_blank');
        } finally {
            btnMP.innerHTML = originalText; 
            btnMP.disabled = false;
        }
    });
}

function removerItem(index) { 
    carrito.splice(index, 1); 
    actualizarCarrito(); 
}
