var Gaffa = require('gaffa'),
	gaffa = new Gaffa(),
	views = gaffa.views.constructors = require('./views'),
	actions = gaffa.actions.constructors = require('./actions'),
	behaviours = gaffa.behaviours.constructors = require('./behaviours');

function createAddTodoForm(){
	var addForm = new views.form(),
		addTodoTextbox = new views.textbox(),
		addTodoIfNotEmpty = new actions.conditional(),
		addTodo = new actions.push(),
		clearNewTodo = new actions.remove();

	addTodoIfNotEmpty.condition.binding = '[]';
	addTodoIfNotEmpty.actions['true'] = [addTodo, clearNewTodo];

	addForm.path = '[/newTodo]';
	addForm.views.content.add(addTodoTextbox);
	addForm.actions.submit = [addTodoIfNotEmpty];
	addTodoTextbox.classes.value = 'newTodo';
	addTodoTextbox.placeholder.value = 'What needs to be done?';

	addTodoTextbox.value.binding = '[]';

	addTodo.source.binding = '(object "label" [])';
	addTodo.target.binding = '[/todos]';

	clearNewTodo.target.binding = '[]';

	return addForm;
}

function createHeader(){
	var header = new views.container(),
		heading = new views.heading();

	heading.text.value = 'todos';

	header.tagName = 'header';
	header.views.content.add([
		heading,
		createAddTodoForm()
	]);

	return header;
}

function createTodoTemplate(){
	var todo = new views.container(),
		todoView = new views.container(),
		completedCheckbox = new views.checkbox(),
		label = new views.label(),
		enableEditing = new actions.set(),
		removeButton = new views.button(),
		removeTodo = new actions.remove(),
		editTodoForm = new views.form(),
		finishEditing = new actions.set(),
		editTodoTextbox = new views.textbox();

	completedCheckbox.showLabel.value = false;
	completedCheckbox.classes.value = 'toggle';
	completedCheckbox.checked.binding = '[completed]';

	label.text.binding = '[label]';
	label.actions.dblclick = [enableEditing];

	enableEditing.source.value = true;
	enableEditing.target.binding = '[editing]';

	removeButton.classes.value = 'destroy';
	removeButton.actions.click = [removeTodo];

	removeTodo.target.binding = '[]';

	todoView.classes.value = 'view';
	todoView.views.content.add([
		completedCheckbox,
		label,
		removeButton
	]);

	todo.tagName = 'li';
	todo.classes.binding = '(join "" (? [completed] "completed") (? [editing] "editing"))';
	todo.views.content.add([
		todoView,
		editTodoForm
	]);

	editTodoTextbox.classes.value = 'edit';
	editTodoTextbox.value.binding = '[label]';
	editTodoTextbox.actions.blur = [finishEditing];

	finishEditing.source.value = false;
	finishEditing.target.binding = '[editing]';

	editTodoForm.actions.submit = [finishEditing];

	editTodoForm.views.content.add(editTodoTextbox);

	return todo;
}

// returns a list of all todos that match the current filter.
var todosInViewBinding = '(? (= [/filter] "all") [/todos] (? (= [/filter] "completed") (filter [/todos] {todo todo.completed}) (filter [/todos] {todo (! todo.completed)})))';

function createTodoList(){
	var todoList = new views.list();

	todoList.tagName = 'ul';
	todoList.classes.value = 'todoList';
	todoList.list.binding = todosInViewBinding;
	todoList.list.template = createTodoTemplate();

	return todoList;
}

function createMainSection(){
	var mainSection = new views.container(),
		toggleAllCheckbox = new views.checkbox(),
		toggleAll = new actions.set();

	toggleAll.source.binding = '[/toggleAll]'
	toggleAll.target.binding = '(map' + todosInViewBinding + '{todo todo.completed})';

	toggleAllCheckbox.showLabel.value = false;
	toggleAllCheckbox.checked.binding = '[/toggleAll]';
	toggleAllCheckbox.classes.value = 'toggleAll';
	toggleAllCheckbox.visible.binding = '(&& [/todos] (> (length [/todos]) 0))';
	toggleAllCheckbox.actions.change = [toggleAll];

	mainSection.tagName = 'section';
	mainSection.classes.value = 'main';

	mainSection.views.content.add([
		toggleAllCheckbox,
		createTodoList()
	]);

	return mainSection;
}

function createFooter(){
	var footer = new views.container(),
		todoCount = new views.html(),
		filters = new views.list(),
		filterContainer = new views.container(),
		filter = new views.anchor(),
		activateFilter = new actions.set(),
		clearCompletedButton = new views.button(),
		clearCompleted = new actions.remove();

	// This is kinda lame. Haven't spent the time to make it clean yet.
	todoCount.html.binding = '({todosLeft (join "" "<strong>" todosLeft "</strong> item" (? (!= todosLeft 1) "s") " left")} (filter [/todos] {todo (! todo.completed)}).length)';
	todoCount.classes.value = 'todoCount';

	filters.list.binding = '[/filters]';
	filters.list.template = filterContainer;
	filters.classes.value = 'filters';
	filters.tagName = 'ul';

	// Binding is relative to the item in the list that has been rendered.
	// In this case: filters/{index}/label
	filter.text.binding = '[label]';
	filter.href.binding = '(join "" "#/" [filter])';
	filter.external = true;
	filter.classes.binding = '(? (= [filter] [/filter]) "selected" "")';
	filter.actions.click = [activateFilter];

	filterContainer.views.content.add(filter);
	filterContainer.tagName = 'li';

	// relative to filters/{index}
	activateFilter.source.binding = '[filter]';
	// slash prefixed routes are root references.
	activateFilter.target.binding = '[/filter]';

	clearCompletedButton.path = '[/todos]';
	clearCompletedButton.text.binding = '(join "" "Clear completed (" (filter [] {todo todo.completed}).length ")")';
	clearCompletedButton.classes.value = 'clearCompleted';
	clearCompletedButton.visible.binding = '(!(!(findOne [] {todo todo.completed})))';
	clearCompletedButton.actions.click = [clearCompleted];

	clearCompleted.target.binding = '(filter [] {todo todo.completed})';

	footer.tagName = 'footer';
	footer.views.content.add([todoCount, filters, clearCompletedButton]);
	footer.visible.binding = '(&& [/todos] (> (length [/todos]) 0))';

	return footer;
}

var setTodoFilterViaHash = new actions.set();
setTodoFilterViaHash.source.binding = '({parts (? (> parts.length 1) (last (split (last parts) "/")) "all")}(split windowLocation "#"))';
setTodoFilterViaHash.target.binding = '[/filter]';

function createAppBehaviours(){
	var onLoadBehaviour = new behaviours.pageLoad(),
		retieveLocalTodos = new actions.browserStorage(),
		persistTodosOnChange = new behaviours.modelChange(),
		persistTodos = new actions.browserStorage();

	retieveLocalTodos.source.value = 'todos';
	retieveLocalTodos.method.value = 'get';
	retieveLocalTodos.target.binding = '[/todos]';

	onLoadBehaviour.actions.load = [retieveLocalTodos, setTodoFilterViaHash];

	persistTodos.target.value = 'todos';
	persistTodos.method.value = 'set';
	persistTodos.source.binding = '[/todos]';

	persistTodosOnChange.watch.binding = '[/todos]';
	persistTodosOnChange.actions.change = [persistTodos];

	return [
		onLoadBehaviour,
		persistTodosOnChange
	];
}

function createAppView(){
	gaffa.views.renderTarget = '.todoapp';
	gaffa.views.add([
		createHeader(),
		createMainSection(),
		createFooter()
	]);
}

// Default model
gaffa.model.set({
	filters:[
		{
			label: "All",
			filter: 'all'
		},
		{
			label: "Active",
			filter: 'active'
		},
		{
			label: "Completed",
			filter: 'completed'
		}
	],
	filter: "all"
});

// App behaviours
gaffa.behaviours.add(createAppBehaviours());

// Custom hash change handler
// slightly hacky, as actions are usually never triggered without a parent;
window.onhashchange = function(){
	gaffa.actions.trigger([
		setTodoFilterViaHash
	], {
		gaffa: gaffa
	});
};

// The only thing that needs to happen after window load is view insertion.
window.onload = createAppView;