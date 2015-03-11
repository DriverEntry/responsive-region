# Marionette.ResponsiveRegion

## Основы
ResponsiveRegion помогает визуализировать состояния модели такие как загрузка, окончание загрузки или ошибка загрузки на уровне Marionette.Region. Для этого используются события Bakbone.Model/Collection request, sync и error соответственно. По умолчанию обозревается модель или коллекция представления, помещаемого в область через ResponsiveRegion.show(view). Обозреваемая модель может указываться явно через ResponsiveRegion.show(view, options) в массиве options.lookupState.entities.

## Использование
ResponsiveRegion является абстрактным классом и не накладывает каких-либо специальных требований к порядку инициализации. При соблюдении правил наследования, указанных ниже, наследники могут инициализироваться точно так же, как Marionette.Region. Например, можно указать тип области в объявлении Marionette.LayoutView.

```
    List.Layout = Marionette.LayoutView.extend({
...
        regions : {
            someRegion : {
                selector : '#region',
                regionClass : Marionette.ResponsiveVisiblityRegion
            }
        }
...
    });
```
Отображение представления в области также не отличается от Marionette.Region:
```
layout.someRegion.show(view)

```
## Наследование

Для определения реакции области на события модели нужно определить наследника Marionette.ResponsiveRegion. Наследник должен определить шаблон обёртки и обработчики изменения состояний, например:

```
    Marionette.ResponsiveVisiblityRegion = Marionette.ResponsiveRegion.extend({
        handleRequest : function()
        {
            this.$el.find('.js-model-state-sync, .js-model-state-error').addClass('hidden');
            this.$el.find('.js-model-state-request').removeClass('hidden');
        },
        handleError : function()
        {
            this.$el.find('.js-model-state-sync, .js-model-state-request').addClass('hidden');
            this.$el.find('.js-model-state-error').removeClass('hidden');
        },
        handleSync : function()
        {
            this.$el.find('.js-model-state-error, .js-model-state-request').addClass('hidden');
            this.$el.find('.js-model-state-sync').removeClass('hidden');
        },
        defaults :  {
            template : '#responsive-region-template'
        }
    });

```
Методы `handle*` должны изменять вид содержимого области при возникновении соответствующих событий. Способ изменения внешнего вида произвольный, единственное требование - они должны сохранять представление и его разметку в неизменном виде.
`defaults` определяет параметры по умолчанию при вызове Marionette.ResponsiveRegion.show(view, options); 
Свойство `defaults.template`  - это шаблон обёртки. Например, Marionette.ResponsiveVisibilityRegion использует такую разметку (здесь используется bootstrap):
```
    <div class="js-model-state-request alert alert-info">
        Загрузка ...
    </div>
    <div class="js-model-state-error alert alert-danger">
        Не удалось загрузить данные
    </div>
    <div class="js-model-state-sync">
    </div>
```
Шаблон определяется в соответствии с Marionette.Renderer. От разметки обёртки зависят только обработчики состояний `handle*`. Поэтому при переопределении всех этих методов производный класс может свободно менять разметку обёртки или отключать её совсем (`template : false`);

Наследник может указать события, которые необходимо прослушивать через `defaults.events`. 
```
    Marionette.ResponsiveOpacityRegion = Marionette.ResponsiveRegion.extend({
        handleValidated : function(){
            ...
        },
        defaults : {
            template : '#responsive-region-opacity-template',
            events : ['request', sync', 'error', 'validated']
        }
    });

```
По умолчанию `events = ['request', sync', 'error']`. Если `defaults.events` - массив, предполагается, что для каждого указанного в нём eventName определён обработчик handleEventname. Можно указать имена обработчиков явно:
```
    Marionette.ResponsiveOpacityRegion = Marionette.ResponsiveRegion.extend({
...
        defaults : {
            template : '#responsive-region-opacity-template',
            events : [{
                'request': 'onRequest',
                'sync': 'onSync',
                'error': 'onError',
                'validation:invalid' : 'onInvalidValidation'
            }]
        }
    });

```
