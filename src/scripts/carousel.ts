/**
 * Carrossel, como string, para qualquer trilho do site.
 *
 * Nasceu nas avaliações e serve também ao trilho de conteúdo do hero: a
 * mecânica é a mesma, só mudam os cartões. O prefixo das classes e dos
 * atributos entra por parâmetro, então duas peças podem usar o mesmo
 * comportamento sem disputar seletor na mesma página.
 *
 * Emitido inline **dentro da guarda de renderização**, pelo mesmo motivo do
 * CSS: uma página sem carrossel, ou com um trilho que já cabe inteiro na
 * tela, não paga um byte por isto. Ver src/styles/reviews.css.ts.
 *
 * O que o navegador já faz sozinho não está aqui. A rolagem, o arraste no
 * celular, o trackpad, o scroll-snap e as setas do teclado sobre a região
 * rolável são nativos: o script só acrescenta as setas, os pontos e o
 * estado deles. Sem JavaScript a seção continua navegável, com a barra de
 * rolagem à mostra como pista de que há mais ao lado.
 *
 * **Não há autoplay.** Carrossel que anda sozinho tira da pessoa o controle
 * da leitura e obriga a inventar pausa no hover, no foco e no toque para
 * devolver o que ele tirou. Quem quiser ver a próxima avaliação clica,
 * arrasta ou usa o teclado.
 *
 * O código emitido abaixo é curto e sem comentários de propósito: tudo o
 * que está nesta string é baixado por quem abre a LP, e explicação que o
 * navegador não lê pertence aqui em cima. O que ele faz, em ordem:
 *
 *  · `montar` roda uma vez por seção. A guarda de `data-${p}-js` existe
 *    porque o script é emitido junto de cada trilho: numa página com dois,
 *    a segunda cópia ligaria um segundo ouvinte em cada seta e o clique
 *    andaria duas páginas de uma vez;
 *  · marcar `data-${p}-js` no invólucro esconde a barra de rolagem e revela
 *    os controles, que dizem a mesma coisa melhor;
 *  · `andar` rola uma largura visível do trilho, seja ela um cartão, dois
 *    ou três. Nenhum número fixo: o scroll-snap encaixa no item mais
 *    próximo depois do salto, então a conta funciona para qualquer
 *    quantidade;
 *  · o limiar de 2px nas pontas é subpixel, não folga arbitrária: o
 *    encaixe do scroll-snap pode parar a uma fração de pixel do zero, e
 *    comparar com zero exato deixaria a seta de voltar acesa no começo do
 *    trilho;
 *  · `sincronizar` recalcula tudo a cada rolagem e a cada resize. Quando
 *    todos os itens cabem na tela não há o que navegar, e a linha de
 *    controles sai inteira em vez de ficar com setas mortas; uma região
 *    que não rola também deixa de receber foco;
 *  · `suave` consulta `prefers-reduced-motion` na hora do clique, e não no
 *    carregamento, para acompanhar quem muda a preferência com a página
 *    aberta.
 *
 * Sem crase em lugar nenhum da string: ela vive dentro de um template
 * literal, e uma crase ali a encerraria no meio.
 */
export const carouselScript = (p: string) => `
(function(){
  var wraps = document.querySelectorAll('[data-${p}-carousel]');
  for (var i = 0; i < wraps.length; i++) montar(wraps[i]);

  function montar(wrap){
    if (wrap.hasAttribute('data-${p}-js')) return;
    var track = wrap.querySelector('.${p}-track');
    var nav = wrap.querySelector('.${p}-nav');
    if (!track || !nav || !track.children.length) return;

    var prev = nav.querySelector('[data-${p}-prev]');
    var next = nav.querySelector('[data-${p}-next]');
    var dots = nav.querySelectorAll('[data-${p}-dot]');
    var itens = track.children;
    var pendente = 0;

    wrap.setAttribute('data-${p}-js', '');

    function suave(){
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'auto' : 'smooth';
    }

    function andar(dir){
      track.scrollBy({ left: dir * track.clientWidth, behavior: suave() });
    }

    function irPara(indice){
      var alvo = itens[indice];
      if (alvo) track.scrollTo({
        left: alvo.offsetLeft - itens[0].offsetLeft,
        behavior: suave()
      });
    }

    function sincronizar(){
      var maximo = track.scrollWidth - track.clientWidth;
      var x = track.scrollLeft;
      var rola = maximo > 2;

      nav.hidden = !rola;
      if (rola) track.setAttribute('tabindex', '0');
      else track.removeAttribute('tabindex');
      if (!rola) return;

      if (prev) prev.disabled = x <= 2;
      if (next) next.disabled = x >= maximo - 2;

      var base = itens[0].offsetLeft;
      var ativo = 0;
      var menor = Infinity;
      for (var i = 0; i < itens.length; i++){
        var dist = Math.abs((itens[i].offsetLeft - base) - x);
        if (dist < menor){ menor = dist; ativo = i; }
      }
      for (var j = 0; j < dots.length; j++){
        dots[j].setAttribute('aria-current', j === ativo ? 'true' : 'false');
      }
    }

    function agendar(){
      if (pendente) return;
      pendente = requestAnimationFrame(function(){ pendente = 0; sincronizar(); });
    }

    if (prev) prev.addEventListener('click', function(){ andar(-1); });
    if (next) next.addEventListener('click', function(){ andar(1); });
    for (var d = 0; d < dots.length; d++) (function(indice){
      dots[indice].addEventListener('click', function(){ irPara(indice); });
    })(d);

    track.addEventListener('scroll', agendar, { passive: true });
    window.addEventListener('resize', agendar);
    sincronizar();
  }
})();
`;
